// policy.ts - Centralised authorization policy engine.
// Enforces permissions based on numeric rank comparisons and NNR constraints (Section 5, NNR-5, NNR-9).

import prisma from './db.js';
import { IAuthSession } from '../../shared/types.js';

export class PolicyService {
  /**
   * Check if a user is authorized to view a specific task
   */
  static async canViewTask(user: IAuthSession, taskId: number): Promise<boolean> {
    // NNR-1: Absolute tenant isolation enforcement
    const task = await prisma.task.findFirst({
      where: { id: taskId },
      include: {
        assignments: true,
        department: true,
      },
    });

    if (!task) return false;
    if (task.tenantId !== user.tenantId) return false; // NNR-1 violation prevention

    // Rule 1: Company Administrators (rankLevel 0) can see everything in their tenant
    if (user.rankLevel === 0) return true;

    // Rule 2: Executive rank levels (rankLevel 1) can read all tasks across the company
    if (user.rankLevel === 1) return true;

    // Rule 3: Original creator can view the task
    if (task.createdById === user.userId) return true;

    // Rule 4: Active assignees can view the task
    const isAssignee = task.assignments.some(
      a => a.userId === user.userId && a.isActive
    );
    if (isAssignee) return true;

    // Rule 5: Department Head of the task's department can view
    if (task.departmentId && task.department?.headUserId === user.userId) {
      return true;
    }

    // Rule 6: Manager of the assignee can view
    // Check if any active assignee reports to the user
    for (const assignment of task.assignments.filter(a => a.isActive)) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignment.userId },
        select: { managerId: true },
      });
      if (assignee && assignee.managerId === user.userId) {
        return true;
      }
    }

    // Default: peers/others at same rank or outside hierarchy cannot view (Lateral isolation)
    return false;
  }

  /**
   * Check if a user can assign tasks to a target user
   */
  static async canAssignTask(
    user: IAuthSession,
    assigneeId: number
  ): Promise<boolean> {
    // Admin bypass within tenant
    if (user.rankLevel === 0) return true;

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      include: { rank: true },
    });

    if (!assignee) return false;
    if (assignee.tenantId !== user.tenantId) return false;

    // Rule 1: Assignee is user's direct report
    if (assignee.managerId === user.userId) return true;

    // Rule 2: Department Head can assign to anyone in their department of lower rank
    if (assignee.departmentId === user.departmentId && user.departmentId !== null) {
      const dept = await prisma.department.findUnique({
        where: { id: user.departmentId },
      });
      if (dept && dept.headUserId === user.userId) {
        // Must check numerical rank level authority (NNR-5)
        const userRank = await prisma.rank.findFirst({
          where: { tenantId: user.tenantId, level: user.rankLevel },
        });
        if (userRank && userRank.level < assignee.rank.level) {
          return true;
        }
      }
    }

    // Rule 3: Valid cross-department authorization request exists and is active (approved, not expired)
    const activeCrossAuth = await prisma.crossDeptAuthorization.findFirst({
      where: {
        tenantId: user.tenantId,
        requesterId: user.userId,
        targetUserId: assigneeId,
        status: 'approved',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (activeCrossAuth) return true;

    return false;
  }

  /**
   * Check if a user can reassign a task to another user (Section 5 Reassignment rules)
   */
  static async canReassignTask(
    user: IAuthSession,
    taskId: number
  ): Promise<boolean> {
    if (user.rankLevel === 0) return true;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { department: true },
    });

    if (!task) return false;
    if (task.tenantId !== user.tenantId) return false;

    // "A task may be reassigned by: the original assigning user, the assignee's department head, or a company administrator."
    
    // Creator check
    if (task.createdById === user.userId) return true;

    // Task department head check
    if (task.departmentId && task.department?.headUserId === user.userId) {
      return true;
    }

    return false;
  }
}
