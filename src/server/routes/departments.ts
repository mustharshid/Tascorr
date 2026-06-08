// departments.ts - API route handlers for department structures and hierarchy nodes.

import { Router, Request, Response } from 'express';
import prisma from '../services/db.js';
import { Validator } from '../utils/validator.js';
import { authenticateSession, requireAdmin } from '../middleware/auth.middleware.js';
import { AuditService } from '../services/audit.js';

const router = Router();

/**
 * GET /api/departments
 * List all departments in the tenant (authenticated users)
 */
router.get('/', authenticateSession, async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const departments = await prisma.department.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        headUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            rank: { select: { title: true } }
          }
        },
        members: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rank: { select: { title: true, level: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ departments });
  } catch (error: any) {
    return res.status(500).json({ error: `Department retrieval error: ${error.message}` });
  }
});

/**
 * POST /api/departments
 * Create a new department (Admin only)
 */
router.post('/', authenticateSession, requireAdmin, async (req: Request, res: Response) => {
  const { name, headUserId } = req.body;
  const tenantId = req.user!.tenantId;

  const missing = Validator.validateRequired(req.body, ['name']);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
  }

  try {
    // Check duplicate name
    const existing = await prisma.department.findFirst({
      where: { tenantId, name, deletedAt: null }
    });

    if (existing) {
      return res.status(400).json({ error: 'A department with this name already exists.' });
    }

    if (headUserId) {
      const headUser = await prisma.user.findUnique({
        where: { id: Number(headUserId) }
      });
      if (!headUser || headUser.tenantId !== tenantId) {
        return res.status(400).json({ error: 'Selected department head is invalid.' });
      }
    }

    const newDept = await prisma.$transaction(async (tx) => {
      const dept = await tx.department.create({
        data: {
          tenantId,
          name,
          headUserId: headUserId ? Number(headUserId) : null
        }
      });

      // Update the user's department to this new department if they are assigned as head
      if (headUserId) {
        await tx.user.update({
          where: { id: Number(headUserId) },
          data: { departmentId: dept.id }
        });
      }

      await AuditService.logAction(
        tenantId,
        req.user!.userId,
        'DEPARTMENT_CREATE',
        'Department',
        dept.id,
        { name, headUserId },
        tx
      );

      return dept;
    });

    return res.status(201).json({ message: 'Department created successfully.', department: newDept });
  } catch (error: any) {
    return res.status(500).json({ error: `Department creation error: ${error.message}` });
  }
});

/**
 * PATCH /api/departments/:id
 * Update department name or department head user (Admin only)
 */
router.patch('/:id', authenticateSession, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, headUserId } = req.body;
  const tenantId = req.user!.tenantId;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid department ID.' });
  }

  try {
    const dept = await prisma.department.findUnique({
      where: { id }
    });

    if (!dept || dept.tenantId !== tenantId || dept.deletedAt !== null) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    if (name) {
      const existing = await prisma.department.findFirst({
        where: { tenantId, name, id: { not: id }, deletedAt: null }
      });
      if (existing) {
        return res.status(400).json({ error: 'A different department already has this name.' });
      }
    }

    if (headUserId) {
      const headUser = await prisma.user.findUnique({
        where: { id: Number(headUserId) }
      });
      if (!headUser || headUser.tenantId !== tenantId) {
        return res.status(400).json({ error: 'Selected department head user is invalid.' });
      }
    }

    const updatedDept = await prisma.$transaction(async (tx) => {
      const d = await tx.department.update({
        where: { id },
        data: {
          name: name || undefined,
          headUserId: headUserId !== undefined ? (headUserId ? Number(headUserId) : null) : undefined
        }
      });

      // Update the user's department to this one if they are assigned as head
      if (headUserId) {
        await tx.user.update({
          where: { id: Number(headUserId) },
          data: { departmentId: id }
        });
      }

      await AuditService.logAction(
        tenantId,
        req.user!.userId,
        'DEPARTMENT_UPDATE',
        'Department',
        id,
        { name, headUserId },
        tx
      );

      return d;
    });

    return res.status(200).json({ message: 'Department updated successfully.', department: updatedDept });
  } catch (error: any) {
    return res.status(500).json({ error: `Department update error: ${error.message}` });
  }
});

/**
 * DELETE /api/departments/:id
 * Soft delete department (Admin only)
 */
router.delete('/:id', authenticateSession, requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const tenantId = req.user!.tenantId;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid department ID.' });
  }

  try {
    const dept = await prisma.department.findUnique({
      where: { id }
    });

    if (!dept || dept.tenantId !== tenantId || dept.deletedAt !== null) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete department
      await tx.department.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      // Unassign members
      await tx.user.updateMany({
        where: { departmentId: id, tenantId },
        data: { departmentId: null }
      });

      await AuditService.logAction(
        tenantId,
        req.user!.userId,
        'DEPARTMENT_DELETE',
        'Department',
        id,
        {},
        tx
      );
    });

    return res.status(200).json({ message: 'Department deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ error: `Department deletion error: ${error.message}` });
  }
});

export default router;
