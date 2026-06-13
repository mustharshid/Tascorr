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
    // Rule: The logged-in user can assign tasks to themselves
    if (user.userId === assigneeId) return true;

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      include: { rank: true },
    });

    if (!assignee) return false;
    if (assignee.tenantId !== user.tenantId) return false;

    // Rule: Do not allow a lower level user to assign task to a higher level user (lower rank level number = higher authority)
    if (user.rankLevel > assignee.rank.level) return false;

    // Admin bypass within tenant (after checking self-assignment and hierarchy bounds)
    if (user.rankLevel === 0) return true;

    // Fetch tenant settings to check peer/lower assignment rules
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { allowCrossDeptPeerAssignment: true }
    });

    // Rule: Same Rank or Lower Rank
    if (user.rankLevel <= assignee.rank.level) {
      if (tenant?.allowCrossDeptPeerAssignment) {
        // If cross-dept assignment is allowed, any peer or subordinate rank in any department is assignable
        return true;
      } else {
        // If disabled, only allow peer/subordinate assignment if they are in the same department
        if (user.departmentId !== null && user.departmentId === assignee.departmentId) {
          return true;
        }
      }
    }

    // Rule 1: Assignee is user's direct report (always allowed regardless of department)
    if (assignee.managerId === user.userId) return true;

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
