"use strict";
// notifications.ts - Route handler for user in-app notification events.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_js_1 = __importDefault(require("../services/db.js"));
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
/**
 * GET /api/notifications
 * Fetch active notifications queue for the current logged-in user
 */
router.get('/', auth_middleware_js_1.authenticateSession, async (req, res) => {
    try {
        const notifications = await db_js_1.default.notification.findMany({
            where: {
                tenantId: req.user.tenantId,
                recipientId: req.user.userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });
        return res.status(200).json({ notifications });
    }
    catch (error) {
        return res.status(500).json({ error: `Notification fetch error: ${error.message}` });
    }
});
/**
 * PATCH /api/notifications/:id/read
 * Mark specific notification item as read
 */
router.patch('/:id/read', auth_middleware_js_1.authenticateSession, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID format.' });
    }
    try {
        const notification = await db_js_1.default.notification.findUnique({
            where: { id },
        });
        if (!notification || notification.recipientId !== req.user.userId || notification.tenantId !== req.user.tenantId) {
            return res.status(404).json({ error: 'Notification not found.' });
        }
        const updated = await db_js_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
        return res.status(200).json({ message: 'Notification marked as read.', notification: updated });
    }
    catch (error) {
        return res.status(500).json({ error: `Notification update error: ${error.message}` });
    }
});
exports.default = router;
