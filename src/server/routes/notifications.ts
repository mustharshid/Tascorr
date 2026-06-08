// notifications.ts - Route handler for user in-app notification events.

import { Router, Request, Response } from 'express';
import prisma from '../services/db.js';
import { authenticateSession } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * GET /api/notifications
 * Fetch active notifications queue for the current logged-in user
 */
router.get('/', authenticateSession, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: req.user!.tenantId,
        recipientId: req.user!.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return res.status(200).json({ notifications });
  } catch (error: any) {
    return res.status(500).json({ error: `Notification fetch error: ${error.message}` });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark specific notification item as read
 */
router.patch('/:id/read', authenticateSession, async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid notification ID format.' });
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.recipientId !== req.user!.userId || notification.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({ message: 'Notification marked as read.', notification: updated });
  } catch (error: any) {
    return res.status(500).json({ error: `Notification update error: ${error.message}` });
  }
});

export default router;
