// tasks.ts - Tasks routing file handling task creation, list, details, updates, blockers, reassignments.

import { Router, Request, Response } from 'express';
import prisma from '../services/db.js';
import { Validator } from '../utils/validator.js';
import { authenticateSession } from '../middleware/auth.middleware.js';
import { PolicyService } from '../services/policy.js';
import { AuditService } from '../services/audit.js';

const router = Router();

/**
 * POST /api/tasks
 * Create task (Manager or above within assignee scoping rules)
 */
router.post('/', authenticateSession, async (req: Request, res: Response) => {
  const { title, description, dueDate, priority, departmentId, assigneeIds, isRecurring, recurrenceInterval, subtasks } = req.body;
  const tenantId = req.user!.tenantId;

  // 1. Validate mandatory fields
  const missing = Validator.validateRequired(req.body, ['title', 'description', 'dueDate', 'priority', 'assigneeIds']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
  }

  if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
    return res.status(400).json({ error: 'A task must have at least one assignee before it can be saved.' });
  }

  if (!Validator.validateDate(dueDate)) {
    return res.status(400).json({ error: 'Invalid due date format.' });
  }

  const validPriorities = ['Critical', 'High', 'Medium', 'Low'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: `Priority must be one of: ${validPriorities.join(', ')}` });
  }

  try {
    // 2. Verify assignees permissions using policy engine
    for (const assigneeId of assigneeIds) {
      const isAllowed = await PolicyService.canAssignTask(req.user!, assigneeId);
      if (!isAllowed) {
        return res.status(403).json({
          error: `Permission denied. Cannot assign task to employee user #${assigneeId} due to hierarchy boundaries or missing cross-department authorization.`,
        });
      }
    }

    // 3. Create task and assign in a single db transaction
    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          tenantId,
          title,
          description,
          dueDate: new Date(dueDate),
          priority,
          departmentId: departmentId || null,
          createdById: req.user!.userId,
          status: 'Pending',
          isRecurring: !!isRecurring,
          recurrenceInterval: recurrenceInterval || null,
        },
      });

      // Create assignments
      const assignmentData = assigneeIds.map((userId: number) => ({
        tenantId,
        taskId: createdTask.id,
        userId,
        isActive: true,
      }));
      await tx.taskAssignment.createMany({
        data: assignmentData,
      });

      // Create subtasks if provided
      if (Array.isArray(subtasks) && subtasks.length > 0) {
        const subtasksData = subtasks.map((s: string) => ({
          tenantId,
          taskId: createdTask.id,
          title: s,
          status: 'Pending',
        }));
        await tx.subtask.createMany({
          data: subtasksData,
        });
      }

      // Write AuditLog
      await AuditService.logAction(
        tenantId,
        req.user!.userId,
        'TASK_CREATE',
        'Task',
        createdTask.id,
        { title, priority, assignees: assigneeIds },
        tx
      );

      return createdTask;
    });

    return res.status(201).json({
      message: 'Task created and assigned successfully.',
      task,
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Task creation error: ${error.message}` });
  }
});

/**
 * GET /api/tasks
 * Get list of visible tasks based on hierarchical permissions (NNR-9)
 */
router.get('/', authenticateSession, async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    // Optimization: Filter at DB level first before policy check
    const whereClause: any = { tenantId };

    // If standard user (not admin, not executive), restrict query to their department, creator status or assignment
    if (req.user!.rankLevel > 1) {
      whereClause.OR = [
        { createdById: req.user!.userId },
        { assignments: { some: { userId: req.user!.userId, isActive: true } } },
        { departmentId: req.user!.departmentId },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Run policy evaluations (filter out any rows failing exact view permission rules)
    const visibleTasks = [];
    for (const task of tasks) {
      const isAllowed = await PolicyService.canViewTask(req.user!, task.id);
      if (isAllowed) {
        visibleTasks.push(task);
      }
    }

    return res.status(200).json({ tasks: visibleTasks });
  } catch (error: any) {
    return res.status(500).json({ error: `Retrieval error: ${error.message}` });
  }
});

/**
 * GET /api/tasks/workload
 * Retrieve aggregated workload counts for the entire tenant, allowing all team members to see full workload allocation.
 */
router.get('/workload', authenticateSession, async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  try {
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        isActive: true,
        task: {
          tenantId: tenantId,
          status: { not: 'Completed' }
        }
      },
      include: {
        task: {
          select: { status: true }
        }
      }
    });

    const workloadMap: Record<number, { count: number; blocked: number }> = {};
    for (const a of assignments) {
      if (!workloadMap[a.userId]) {
        workloadMap[a.userId] = { count: 0, blocked: 0 };
      }
      workloadMap[a.userId].count++;
      if (a.task.status === 'Blocked') {
        workloadMap[a.userId].blocked++;
      }
    }

    return res.status(200).json({ workload: workloadMap });
  } catch (error: any) {
    return res.status(500).json({ error: `Workload retrieval error: ${error.message}` });
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve detail context of specific task (C5, NNR-9)
 */
router.get('/:id', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format.' });
  }

  try {
    const isAllowed = await PolicyService.canViewTask(req.user!, taskId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied. You are not authorized to view this task.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        blockers: {
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        subtasks: true,
      },
    });

    return res.status(200).json({ task });
  } catch (error: any) {
    return res.status(500).json({ error: `Lookup error: ${error.message}` });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Transition task status (Workflow Rules)
 */
router.patch('/:id/status', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { status } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  const validStatuses = ['Pending', 'In Progress', 'Blocked', 'Under Review', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const isAllowed = await PolicyService.canViewTask(req.user!, taskId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Workflow Rule: Completed is terminal and cannot be reversed (Section 5 Workflow Rules)
    if (task.status === 'Completed' && status !== 'Completed') {
      return res.status(400).json({ error: 'Completed is a terminal state and cannot be reversed.' });
    }

    // Role restriction for completing tasks
    if (status === 'Completed') {
      const isCreator = task.createdById === req.user!.userId;
      const isAdmin = req.user!.rankLevel === 0;
      const isDeptHead = task.departmentId === req.user!.departmentId && req.user!.rankLevel <= 4 && req.user!.rankLevel > 0; // rough check, but better to check exact dept head
      // Let's query dept head directly:
      let isActualDeptHead = false;
      if (task.departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: task.departmentId } });
        if (dept && dept.headUserId === req.user!.userId) {
          isActualDeptHead = true;
        }
      }

      if (!isCreator && !isAdmin && !isActualDeptHead) {
        return res.status(403).json({ error: 'Access denied. Only the task assigner, department head, or administrator can mark a task as Completed.' });
      }
    }

    // Transition status and audit in transaction
    const updatedTask = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId },
        data: { status },
      });

      await AuditService.logAction(
        req.user!.tenantId,
        req.user!.userId,
        'TASK_STATUS_CHANGE',
        'Task',
        taskId,
        { from: task.status, to: status },
        tx
      );

      // Handle recurring task auto-generation if status transitioned to Completed
      if (status === 'Completed' && task.status !== 'Completed' && task.isRecurring) {
        // Calculate next due date
        const nextDueDate = new Date(task.dueDate);
        if (task.recurrenceInterval === 'Daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (task.recurrenceInterval === 'Weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrenceInterval === 'Monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // Create the next occurrence
        const nextTask = await tx.task.create({
          data: {
            tenantId: task.tenantId,
            title: task.title,
            description: task.description,
            dueDate: nextDueDate,
            priority: task.priority,
            departmentId: task.departmentId,
            createdById: task.createdById,
            status: 'Pending',
            isRecurring: true,
            recurrenceInterval: task.recurrenceInterval,
          },
        });

        // Find current active assignments of the task
        const activeAssignments = await tx.taskAssignment.findMany({
          where: { taskId: task.id, isActive: true },
        });

        // Duplicate active assignments to the next task occurrence
        for (const assignment of activeAssignments) {
          await tx.taskAssignment.create({
            data: {
              tenantId: task.tenantId,
              taskId: nextTask.id,
              userId: assignment.userId,
              isActive: true,
            },
          });
        }

        // Log audit action for the auto-created task
        await AuditService.logAction(
          task.tenantId,
          task.createdById,
          'TASK_CREATE_RECURRING',
          'Task',
          nextTask.id,
          { title: nextTask.title, parentTaskId: task.id },
          tx
        );
      }

      return t;
    });

    return res.status(200).json({ message: 'Task status updated.', task: updatedTask });
  } catch (error: any) {
    return res.status(500).json({ error: `Update error: ${error.message}` });
  }
});

/**
 * PATCH /api/tasks/:id
 * Edit task elements (Title, Description, DueDate, Priority). Restricted to Creator.
 */
router.patch('/:id', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { title, description, dueDate, priority } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.tenantId !== req.user!.tenantId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Only creator can edit
    if (task.createdById !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied. Only the task creator can edit task details.' });
    }

    // Validation
    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (priority !== undefined) {
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority.' });
      }
      updates.priority = priority;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update.' });
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id: taskId },
        data: updates
      });

      await AuditService.logAction(
        req.user!.tenantId,
        req.user!.userId,
        'TASK_EDIT',
        'Task',
        taskId,
        { updates },
        tx
      );
      
      return t;
    });

    return res.status(200).json({ message: 'Task updated successfully.', task: updatedTask });
  } catch (error: any) {
    return res.status(500).json({ error: `Update error: ${error.message}` });
  }
});

/**
 * POST /api/tasks/:id/reassign
 * Reassign task (requires reason parameter, NNR-6)
 */
router.post('/:id/reassign', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { targetAssigneeId, reason } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  const missing = Validator.validateRequired(req.body, ['targetAssigneeId', 'reason']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')} (Reassignment reason is mandatory).` });
  }

  try {
    // 1. Authorisation policy check
    const isAuthorized = await PolicyService.canReassignTask(req.user!, taskId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied. Only creator, department head, or admin can reassign.' });
    }

    const isAssignable = await PolicyService.canAssignTask(req.user!, targetAssigneeId);
    if (!isAssignable) {
      return res.status(403).json({ error: 'Selected target assignee violates hierarchy/authorization limits.' });
    }

    // 2. Perform transaction reassign
    await prisma.$transaction(async (tx) => {
      // Find current active assignment
      const currentActive = await tx.taskAssignment.findFirst({
        where: { taskId, isActive: true },
      });

      const fromUserId = currentActive ? currentActive.userId : null;

      // Deactivate previous
      if (currentActive) {
        await tx.taskAssignment.update({
          where: { id: currentActive.id },
          data: { isActive: false },
        });
      }

      // Create new assignment trail
      await tx.taskAssignment.create({
        data: {
          tenantId: req.user!.tenantId,
          taskId,
          userId: targetAssigneeId,
          reassignedFromUserId: fromUserId,
          reassignmentReason: reason,
          reassignedById: req.user!.userId,
          reassignedAt: new Date(),
          isActive: true,
        },
      });

      // Write AuditLog
      await AuditService.logAction(
        req.user!.tenantId,
        req.user!.userId,
        'TASK_REASSIGN',
        'Task',
        taskId,
        { fromUserId, toUserId: targetAssigneeId, reason },
        tx
      );
    });

    return res.status(200).json({ message: 'Task reassigned successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: `Reassignment error: ${error.message}` });
  }
});

/**
 * POST /api/tasks/:id/blockers
 * Flag task as blocked (suspends deadline counting, NNR-3)
 */
router.post('/:id/blockers', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { description } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  if (!description || description.trim() === '') {
    return res.status(400).json({ error: 'Blocker report description is mandatory.' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Only active assignee can raise blocker
    const isAssignee = task.assignments.some(
      a => a.userId === req.user!.userId && a.isActive
    );

    if (!isAssignee) {
      return res.status(403).json({ error: 'Access denied. Only the active assignee can flag a blocker.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create blocker record
      await tx.blocker.create({
        data: {
          tenantId: req.user!.tenantId,
          taskId,
          reporterId: req.user!.userId,
          description,
        },
      });

      // 2. Set Task Status to Blocked (which triggers pending deadline, NNR-3)
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'Blocked' },
      });

      // 3. Log action
      await AuditService.logAction(
        req.user!.tenantId,
        req.user!.userId,
        'TASK_BLOCKED',
        'Task',
        taskId,
        { description },
        tx
      );
    });

    return res.status(200).json({ message: 'Task flagged as blocked successfully. Deadline suspended.' });
  } catch (error: any) {
    return res.status(500).json({ error: `Blocker submission error: ${error.message}` });
  }
});

/**
 * PATCH /api/tasks/:id/blockers/:blockerId/resolve
 * Resolve a flagged blocker (Creator, Admin, or Dept Head scope)
 */
router.patch('/:id/blockers/:blockerId/resolve', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const blockerId = Number(req.params.blockerId);
  const { resolutionComment } = req.body;

  if (isNaN(taskId) || isNaN(blockerId)) {
    return res.status(400).json({ error: 'Invalid task ID or blocker ID format.' });
  }

  const missing = Validator.validateRequired(req.body, ['resolutionComment']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { department: true },
    });

    if (!task || task.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
    });

    if (!blocker || blocker.taskId !== taskId) {
      return res.status(404).json({ error: 'Blocker record not found for this task.' });
    }

    if (blocker.resolvedAt !== null) {
      return res.status(400).json({ error: 'This blocker has already been resolved.' });
    }

    // Authorization: Creator, Admin, or Department Head can resolve
    const isAdmin = req.user!.rankLevel === 0;
    const isCreator = task.createdById === req.user!.userId;
    const isDeptHead = task.department?.headUserId === req.user!.userId;

    if (!isAdmin && !isCreator && !isDeptHead) {
      return res.status(403).json({ error: 'Access denied. Only the task creator, company administrator, or department head can resolve blockers.' });
    }

    // Resolve blocker and restore status to In Progress
    const resolvedBlocker = await prisma.$transaction(async (tx) => {
      const b = await tx.blocker.update({
        where: { id: blockerId },
        data: {
          resolvedAt: new Date(),
          resolutionComment,
          resolvedById: req.user!.userId,
        },
      });

      // Restore task status back to In Progress
      await tx.task.update({
        where: { id: taskId },
        data: { status: 'In Progress' },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId: req.user!.tenantId,
          actorId: req.user!.userId,
          action: 'TASK_BLOCKER_RESOLVE',
          entityType: 'Blocker',
          entityId: blockerId,
          metadata: JSON.stringify({ taskId, resolutionComment }),
        },
      });

      return b;
    });

    return res.status(200).json({ message: 'Blocker resolved successfully. Task status set to In Progress.', blocker: resolvedBlocker });
  } catch (error: any) {
    return res.status(500).json({ error: `Blocker resolution error: ${error.message}` });
  }
});

/**
 * POST /api/tasks/:id/comments
 * Add comment to task (Access: visible tasks only)
 */
router.post('/:id/comments', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { content } = req.body;

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID format.' });
  }

  const missing = Validator.validateRequired(req.body, ['content']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
  }

  try {
    const isAllowed = await PolicyService.canViewTask(req.user!, taskId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied. You cannot view or comment on this task.' });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.taskComment.create({
        data: {
          tenantId: req.user!.tenantId,
          taskId,
          authorId: req.user!.userId,
          content,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId: req.user!.tenantId,
          actorId: req.user!.userId,
          action: 'TASK_COMMENT_ADD',
          entityType: 'TaskComment',
          entityId: c.id,
          metadata: JSON.stringify({ taskId, commentLength: content.length }),
        },
      });

      return c;
    });

    return res.status(201).json({ message: 'Comment added successfully.', comment });
  } catch (error: any) {
    return res.status(500).json({ error: `Comment insertion error: ${error.message}` });
  }
});

/**
 * PATCH /api/tasks/:id/subtasks/:subtaskId
 * Update status of a subtask (Access: visible tasks assignee or admin/manager)
 */
router.patch('/:id/subtasks/:subtaskId', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const subtaskId = Number(req.params.subtaskId);
  const { status } = req.body;

  if (isNaN(taskId) || isNaN(subtaskId)) {
    return res.status(400).json({ error: 'Invalid task ID or subtask ID.' });
  }

  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const isAllowed = await PolicyService.canViewTask(req.user!, taskId);
    if (!isAllowed) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask || subtask.taskId !== taskId) {
      return res.status(404).json({ error: 'Subtask not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.subtask.update({
        where: { id: subtaskId },
        data: { status },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId: req.user!.tenantId,
          actorId: req.user!.userId,
          action: 'TASK_SUBTASK_STATUS',
          entityType: 'Subtask',
          entityId: subtaskId,
          metadata: JSON.stringify({ taskId, status }),
        },
      });

      return s;
    });

    return res.status(200).json({ message: 'Subtask status updated.', subtask: updated });
  } catch (error: any) {
    return res.status(500).json({ error: `Subtask update error: ${error.message}` });
  }
});

router.delete('/:id', authenticateSession, async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  if (isNaN(taskId)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (task.tenantId !== req.user!.tenantId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Only creator can delete
    if (task.createdById !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied. Only the task creator can delete this task.' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete task assignments
      await tx.taskAssignment.deleteMany({ where: { taskId } });

      // Delete blocker reports
      await tx.blocker.deleteMany({ where: { taskId } });

      // Delete task comments
      await tx.taskComment.deleteMany({ where: { taskId } });

      // Delete subtasks
      await tx.subtask.deleteMany({ where: { taskId } });

      // Delete task dependencies
      await tx.taskDependency.deleteMany({
        where: {
          OR: [
            { taskId },
            { prerequisiteTaskId: taskId }
          ]
        }
      });

      // Delete the task itself
      await tx.task.delete({ where: { id: taskId } });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          tenantId: req.user!.tenantId,
          actorId: req.user!.userId,
          action: 'TASK_DELETE',
          entityType: 'Task',
          entityId: taskId,
          metadata: JSON.stringify({ title: task.title }),
        },
      });
    });

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: `Task deletion error: ${error.message}` });
  }
});

export default router;

