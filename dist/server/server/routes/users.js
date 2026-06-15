"use strict";
// users.ts - Users directory and account provisioning API routing.
// Enforces Admin-Only Employee Provisioning (NNR-4) and Tier 1 scaling gates (NNR-8).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = __importDefault(require("../services/db.js"));
const validator_js_1 = require("../utils/validator.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const audit_js_1 = require("../services/audit.js");
const router = (0, express_1.Router)();
/**
 * POST /api/users
 * Provision new employee (Admin scope, NNR-4)
 */
router.post('/', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const { email, password, firstName, lastName, rankId, departmentId, managerId } = req.body;
    const tenantId = req.user.tenantId;
    // 1. Mandatory Parameter check
    const missing = validator_js_1.Validator.validateRequired(req.body, ['email', 'password', 'firstName', 'lastName', 'rankId']);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
    }
    if (!validator_js_1.Validator.validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
    }
    // Password length & strength checks
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    try {
        // 2. Enforce Tier 1 boundary limits (NNR-8, Section 5 Billing)
        const tenant = await db_js_1.default.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant workspace not found.' });
        }
        if (tenant.subscriptionTier === 1) {
            const activeUserCount = await db_js_1.default.user.count({
                where: { tenantId, deletedAt: null },
            });
            // Hard gate deflection trigger
            if (activeUserCount >= 10) {
                return res.status(403).json({
                    error: 'Tier 1 boundary limit exceeded (Maximum 10 employee accounts). Access gate locked. Please contact support at +960 7451198 to upgrade your account tier.',
                    supportContact: '+960 7451198',
                });
            }
        }
        // 3. Assert uniqueness of email
        const existing = await db_js_1.default.user.findFirst({
            where: { email },
        });
        if (existing) {
            return res.status(400).json({ error: 'Email address already registered in the system.' });
        }
        // Verify target rank belongs to the tenant
        const rank = await db_js_1.default.rank.findUnique({
            where: { id: rankId },
        });
        if (!rank || rank.tenantId !== tenantId) {
            return res.status(400).json({ error: 'Selected rank level is invalid for this workspace.' });
        }
        // Enforce single Company Administrator per tenant (level 0)
        if (rank.level === 0) {
            const existingAdmin = await db_js_1.default.user.findFirst({
                where: { tenantId, rank: { level: 0 }, deletedAt: null }
            });
            if (existingAdmin) {
                return res.status(409).json({ error: 'Only one Company Administrator is allowed per organization. An administrator already exists.' });
            }
        }
        // Verify department belongs to the tenant
        if (departmentId) {
            const dept = await db_js_1.default.department.findUnique({
                where: { id: departmentId },
            });
            if (!dept || dept.tenantId !== tenantId) {
                return res.status(400).json({ error: 'Selected department is invalid for this workspace.' });
            }
        }
        // Verify manager exists in this tenant
        if (managerId) {
            const manager = await db_js_1.default.user.findUnique({
                where: { id: managerId },
            });
            if (!manager || manager.tenantId !== tenantId) {
                return res.status(400).json({ error: 'Selected manager is invalid.' });
            }
        }
        // 4. Hash password with bcrypt cost factor 12
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // 5. Execute transaction: create user and write audit log
        const newUser = await db_js_1.default.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    tenantId,
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    rankId,
                    departmentId: departmentId || null,
                    managerId: managerId || null,
                    status: 'active',
                },
            });
            // Write append-only immutable audit entry
            await audit_js_1.AuditService.logAction(tenantId, req.user.userId, 'USER_CREATE', 'User', createdUser.id, { email, rankId, departmentId }, tx);
            return createdUser;
        });
        return res.status(201).json({
            message: 'Employee user account created successfully.',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                rankId: newUser.rankId,
                departmentId: newUser.departmentId,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: `Provisioning error: ${error.message}` });
    }
});
/**
 * GET /api/users/ranks
 * Get all ranks for the active tenant
 */
router.get('/ranks', auth_middleware_js_1.authenticateSession, async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const ranks = await db_js_1.default.rank.findMany({
            where: { tenantId },
            orderBy: { level: 'asc' }
        });
        return res.status(200).json({ ranks });
    }
    catch (error) {
        return res.status(500).json({ error: `Failed to fetch ranks: ${error.message}` });
    }
});
/**
 * POST /api/users/ranks
 * Add a new rank level for the active tenant (Admin only)
 */
router.post('/ranks', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    const { title, level } = req.body;
    if (!title || level === undefined) {
        return res.status(400).json({ error: 'Title and authority level integer are required.' });
    }
    const levelInt = Number(level);
    if (isNaN(levelInt) || levelInt < 0) {
        return res.status(400).json({ error: 'Authority level must be a non-negative integer.' });
    }
    try {
        // Check if level is already taken for this tenant
        const existing = await db_js_1.default.rank.findUnique({
            where: { tenantId_level: { tenantId, level: levelInt } }
        });
        if (existing) {
            return res.status(400).json({ error: `Authority level ${levelInt} is already assigned to "${existing.title}".` });
        }
        const newRank = await db_js_1.default.rank.create({
            data: {
                tenantId,
                title: title.trim(),
                level: levelInt
            }
        });
        return res.status(201).json({ message: 'Rank created successfully.', rank: newRank });
    }
    catch (error) {
        return res.status(500).json({ error: `Failed to create rank: ${error.message}` });
    }
});
const policy_js_1 = require("../services/policy.js");
/**
 * GET /api/users
 * List users (Authenticated scopes)
 */
router.get('/', auth_middleware_js_1.authenticateSession, async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const users = await db_js_1.default.user.findMany({
            where: { tenantId, deletedAt: null },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                rankId: true,
                departmentId: true,
                managerId: true,
                status: true,
                rank: {
                    select: {
                        title: true,
                        level: true,
                    },
                },
                department: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                lastName: 'asc',
            },
        });
        if (req.query.assignableOnly === 'true') {
            const filteredUsers = [];
            for (const u of users) {
                if (await policy_js_1.PolicyService.canAssignTask(req.user, u.id)) {
                    filteredUsers.push(u);
                }
            }
            return res.status(200).json({ users: filteredUsers });
        }
        return res.status(200).json({ users });
    }
    catch (error) {
        return res.status(500).json({ error: `Retrieval error: ${error.message}` });
    }
});
/**
 * GET /api/users/:id
 * Individual user profile details (Section 4, C5)
 */
router.get('/:id', auth_middleware_js_1.authenticateSession, async (req, res) => {
    const tenantId = req.user.tenantId;
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    try {
        const user = await db_js_1.default.user.findUnique({
            where: { id: userId },
            include: {
                rank: true,
                department: true,
            },
        });
        if (!user || user.tenantId !== tenantId || user.deletedAt !== null) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        // Section 4 C5 Rule: Profile is visible to the user and users above them in hierarchy
        const userRankLevel = user.rank.level;
        const requestingUserRankLevel = req.user.rankLevel;
        const isSelf = user.id === req.user.userId;
        const isAbove = requestingUserRankLevel < userRankLevel; // Lower level integer = higher authority
        const isAdmin = req.user.rankLevel === 0;
        if (!isSelf && !isAbove && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. Profiling visibility restricted upwards.' });
        }
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                rank: user.rank.title,
                rankLevel: user.rank.level,
                department: user.department?.name || null,
                status: user.status,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: `Profile lookup error: ${error.message}` });
    }
});
/**
 * PATCH /api/users/:id
 * Update user profile details (firstName, lastName, password if provided)
 */
router.patch('/:id', auth_middleware_js_1.authenticateSession, async (req, res) => {
    const tenantId = req.user.tenantId;
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format.' });
    }
    const isSelf = userId === req.user.userId;
    const isAdmin = req.user.rankLevel === 0;
    if (!isSelf && !isAdmin) {
        return res.status(403).json({ error: 'Access denied. You can only update your own profile details.' });
    }
    console.log('[DEBUG PATCH USER] Requester:', req.user, 'Target ID:', userId, 'isSelf:', isSelf, 'isAdmin:', isAdmin, 'Body:', req.body);
    const { firstName, lastName, password, rankId, departmentId, status } = req.body;
    try {
        const user = await db_js_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.tenantId !== tenantId || user.deletedAt !== null) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        const updateData = {};
        if (firstName !== undefined) {
            if (firstName.trim().length === 0) {
                return res.status(400).json({ error: 'First name cannot be empty.' });
            }
            updateData.firstName = firstName.trim();
        }
        if (lastName !== undefined) {
            if (lastName.trim().length === 0) {
                return res.status(400).json({ error: 'Last name cannot be empty.' });
            }
            updateData.lastName = lastName.trim();
        }
        if (password !== undefined) {
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
            }
            updateData.passwordHash = await bcryptjs_1.default.hash(password, 12);
        }
        // Admin-only fields: rank, department, status
        if (isAdmin) {
            if (rankId !== undefined) {
                const rank = await db_js_1.default.rank.findUnique({ where: { id: Number(rankId) } });
                if (!rank || rank.tenantId !== tenantId) {
                    return res.status(400).json({ error: 'Invalid rank selected.' });
                }
                // Enforce single Company Administrator per tenant (level 0)
                if (rank.level === 0) {
                    const existingAdmin = await db_js_1.default.user.findFirst({
                        where: { tenantId, rank: { level: 0 }, deletedAt: null, id: { not: userId } }
                    });
                    if (existingAdmin) {
                        return res.status(409).json({ error: 'Only one Company Administrator is allowed per organization. An administrator already exists.' });
                    }
                }
                updateData.rankId = Number(rankId);
            }
            if (departmentId !== undefined) {
                if (departmentId === null || departmentId === '') {
                    updateData.departmentId = null;
                }
                else {
                    const dept = await db_js_1.default.department.findUnique({ where: { id: Number(departmentId) } });
                    if (!dept || dept.tenantId !== tenantId) {
                        return res.status(400).json({ error: 'Invalid department selected.' });
                    }
                    updateData.departmentId = Number(departmentId);
                }
            }
            if (status !== undefined) {
                const validStatuses = ['active', 'deactivated'];
                if (!validStatuses.includes(status.toLowerCase())) {
                    return res.status(400).json({ error: 'Invalid status value. Must be active or deactivated.' });
                }
                updateData.status = status.toLowerCase();
            }
        }
        const updatedUser = await db_js_1.default.user.update({
            where: { id: userId },
            data: updateData,
            include: { rank: true, department: true },
        });
        return res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                id: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                rankId: updatedUser.rankId,
                departmentId: updatedUser.departmentId,
                status: updatedUser.status,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ error: `Profile update error: ${error.message}` });
    }
});
/**
 * GET /api/users/tenant
 * Retrieve current tenant details (Admin only)
 */
router.get('/tenant/details', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    try {
        const tenant = await db_js_1.default.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, subscriptionTier: true, status: true, allowCrossDeptPeerAssignment: true, slaAccessLevel: true }
        });
        return res.status(200).json({ tenant });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/users/tenant
 * Update tenant details like name (Admin only)
 */
router.patch('/tenant/details', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    const { name, allowCrossDeptPeerAssignment, slaAccessLevel } = req.body;
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Company name is required.' });
    }
    const updateData = { name: name.trim() };
    if (typeof allowCrossDeptPeerAssignment === 'boolean') {
        updateData.allowCrossDeptPeerAssignment = allowCrossDeptPeerAssignment;
    }
    if (slaAccessLevel !== undefined) {
        const levelInt = Number(slaAccessLevel);
        if (!isNaN(levelInt) && levelInt >= 0) {
            updateData.slaAccessLevel = levelInt;
        }
    }
    try {
        const updated = await db_js_1.default.tenant.update({
            where: { id: tenantId },
            data: updateData
        });
        // Write audit log
        await db_js_1.default.auditLog.create({
            data: {
                tenantId,
                actorId: req.user.userId,
                action: 'TENANT_UPDATE',
                entityType: 'Tenant',
                entityId: tenantId,
                metadata: JSON.stringify(updateData),
            },
        });
        return res.status(200).json({ message: 'Company details updated successfully.', tenant: updated });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * PATCH /api/users/ranks/:rankId
 * Update a rank title and/or level (Admin only)
 */
router.patch('/ranks/:rankId', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    const rankId = Number(req.params.rankId);
    if (isNaN(rankId))
        return res.status(400).json({ error: 'Invalid rank ID.' });
    const { title, level } = req.body;
    if (!title && level === undefined) {
        return res.status(400).json({ error: 'At least one of title or level is required.' });
    }
    try {
        const rank = await db_js_1.default.rank.findUnique({ where: { id: rankId } });
        if (!rank || rank.tenantId !== tenantId) {
            return res.status(404).json({ error: 'Rank not found.' });
        }
        const updateData = {};
        if (title !== undefined && title.trim().length > 0)
            updateData.title = title.trim();
        if (level !== undefined) {
            const levelInt = Number(level);
            if (isNaN(levelInt) || levelInt < 0) {
                return res.status(400).json({ error: 'Authority level must be a non-negative integer.' });
            }
            // Check the new level isn't already taken by another rank
            const conflict = await db_js_1.default.rank.findFirst({
                where: { tenantId, level: levelInt, id: { not: rankId } }
            });
            if (conflict) {
                return res.status(400).json({ error: `Level ${levelInt} is already used by "${conflict.title}".` });
            }
            updateData.level = levelInt;
        }
        const updated = await db_js_1.default.rank.update({ where: { id: rankId }, data: updateData });
        return res.status(200).json({ message: 'Rank updated successfully.', rank: updated });
    }
    catch (error) {
        return res.status(500).json({ error: `Rank update error: ${error.message}` });
    }
});
/**
 * DELETE /api/users/ranks/:rankId
 * Delete a corporate rank role (Admin only). Cannot delete if users are assigned to it.
 */
router.delete('/ranks/:rankId', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    const rankId = Number(req.params.rankId);
    if (isNaN(rankId))
        return res.status(400).json({ error: 'Invalid rank ID.' });
    try {
        const rank = await db_js_1.default.rank.findUnique({ where: { id: rankId } });
        if (!rank || rank.tenantId !== tenantId) {
            return res.status(404).json({ error: 'Rank not found.' });
        }
        // Safety: prevent deletion if employees are still assigned to it
        const assignedCount = await db_js_1.default.user.count({
            where: { rankId, tenantId, deletedAt: null }
        });
        if (assignedCount > 0) {
            return res.status(409).json({
                error: `Cannot delete: ${assignedCount} employee(s) are currently assigned to this rank. Reassign them first.`
            });
        }
        await db_js_1.default.rank.delete({ where: { id: rankId } });
        return res.status(200).json({ message: 'Rank deleted successfully.' });
    }
    catch (error) {
        return res.status(500).json({ error: `Rank deletion error: ${error.message}` });
    }
});
/**
 * DELETE /api/users/:id
 * Soft-delete an employee (Admin only). Sets deletedAt timestamp.
 * Admins cannot delete themselves.
 */
router.delete('/:id', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireAdmin, async (req, res) => {
    const tenantId = req.user.tenantId;
    const userId = Number(req.params.id);
    if (isNaN(userId))
        return res.status(400).json({ error: 'Invalid user ID.' });
    // Prevent self-deletion
    if (userId === req.user.userId) {
        return res.status(403).json({ error: 'You cannot delete your own account.' });
    }
    try {
        const user = await db_js_1.default.user.findUnique({
            where: { id: userId },
            include: { rank: true }
        });
        if (!user || user.tenantId !== tenantId) {
            return res.status(404).json({ error: 'Employee not found within your organization.' });
        }
        if (user.deletedAt) {
            return res.status(409).json({ error: 'This employee has already been deleted.' });
        }
        // Prevent deleting a user with a higher or equal rank (lower level number = higher authority)
        const targetRankLevel = user.rank?.level ?? 999;
        const currentRankLevel = req.user.rankLevel;
        if (targetRankLevel <= currentRankLevel) {
            return res.status(403).json({ error: 'You cannot delete an employee of equal or higher rank.' });
        }
        await db_js_1.default.user.update({
            where: { id: userId },
            data: { deletedAt: new Date(), status: 'deactivated' }
        });
        return res.status(200).json({ message: 'Employee deleted successfully.' });
    }
    catch (error) {
        return res.status(500).json({ error: `Deletion error: ${error.message}` });
    }
});
exports.default = router;
