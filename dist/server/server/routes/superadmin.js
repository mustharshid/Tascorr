"use strict";
// superadmin.ts - Global superadmin workspace onboarding and platform controls.
// Enforces separate superadmin console requirements (Section 8) and global logging (NNR-7).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = __importDefault(require("../services/db.js"));
const validator_js_1 = require("../utils/validator.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
/**
 * POST /api/superadmin/tenants
 * Onboard new organization/tenant workspace (Superadmin scope, NNR-7)
 */
router.post('/tenants', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireSuperadmin, async (req, res) => {
    const { name, adminEmail, adminPassword, subscriptionTier } = req.body;
    // 1. Validate inputs
    const missing = validator_js_1.Validator.validateRequired(req.body, ['name', 'adminEmail', 'adminPassword']);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing mandatory parameter fields: ${missing.join(', ')}` });
    }
    if (!validator_js_1.Validator.validateEmail(adminEmail)) {
        return res.status(400).json({ error: 'Invalid admin email address format.' });
    }
    // Enforce installer/superadmin complexity standards (Section 9.3.5)
    if (!validator_js_1.Validator.validatePassword(adminPassword)) {
        return res.status(400).json({
            error: 'Admin password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.',
        });
    }
    const tier = subscriptionTier ? Number(subscriptionTier) : 1;
    if (![1, 2, 3].includes(tier)) {
        return res.status(400).json({ error: 'Subscription tier must be 1, 2, or 3.' });
    }
    try {
        // Check if email already exists
        const emailExists = await db_js_1.default.user.findFirst({
            where: { email: adminEmail },
        });
        if (emailExists) {
            return res.status(400).json({ error: 'Admin email already exists in system database.' });
        }
        // 2. Perform transaction: tenant, default ranks, and admin user account
        const result = await db_js_1.default.$transaction(async (tx) => {
            // a. Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subscriptionTier: tier,
                    status: 'active',
                },
            });
            // b. Create Default numerical Ranks for this tenant (NNR-5 rank-levels structure)
            const adminRank = await tx.rank.create({
                data: { tenantId: tenant.id, title: 'Company Administrator', level: 0 },
            });
            await tx.rank.create({
                data: { tenantId: tenant.id, title: 'Executive / Director', level: 1 },
            });
            await tx.rank.create({
                data: { tenantId: tenant.id, title: 'VP / Department Head', level: 2 },
            });
            await tx.rank.create({
                data: { tenantId: tenant.id, title: 'Manager / Team Leader', level: 3 },
            });
            await tx.rank.create({
                data: { tenantId: tenant.id, title: 'Employee / Individual Contributor', level: 4 },
            });
            // c. Hash Admin password
            const hash = await bcryptjs_1.default.hash(adminPassword, 12);
            // d. Create Admin User
            const adminUser = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: adminEmail,
                    passwordHash: hash,
                    firstName: 'Company',
                    lastName: 'Administrator',
                    rankId: adminRank.id,
                    status: 'active',
                },
            });
            // e. Write audit log (Superadmin action trace, NNR-7)
            await tx.auditLog.create({
                data: {
                    tenantId: 0, // Global Scope ID
                    actorId: req.user.userId,
                    action: 'TENANT_ONBOARD',
                    entityType: 'Tenant',
                    entityId: tenant.id,
                    metadata: JSON.stringify({ name, adminEmail, tier }),
                },
            });
            return { tenant, adminUser };
        });
        return res.status(201).json({
            message: 'Organization onboarded and workspace created successfully.',
            tenantId: result.tenant.id,
            adminUser: {
                id: result.adminUser.id,
                email: result.adminUser.email,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: `Onboarding error: ${error.message}` });
    }
});
/**
 * GET /api/superadmin/audit-logs
 * Review platform-level audit log history (Superadmin scope, NNR-7)
 */
router.get('/audit-logs', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireSuperadmin, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;
        const actor = req.query.actor ? String(req.query.actor).trim() : '';
        const action = req.query.action ? String(req.query.action).trim() : '';
        const company = req.query.company ? String(req.query.company).trim() : '';
        const startDate = req.query.startDate ? String(req.query.startDate).trim() : '';
        const endDate = req.query.endDate ? String(req.query.endDate).trim() : '';
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const where = {};
        const now = new Date();
        where.AND = [
            {
                OR: [
                    { tenantId: 0 },
                    {
                        tenant: {
                            supportAccessGrantedUntil: {
                                gt: now
                            }
                        }
                    }
                ]
            }
        ];
        if (actor) {
            where.actor = {
                email: {
                    contains: actor
                }
            };
        }
        if (action) {
            where.action = {
                contains: action
            };
        }
        if (company) {
            where.tenant = {
                name: {
                    contains: company
                }
            };
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                if (endDate.length <= 10) {
                    end.setHours(23, 59, 59, 999);
                }
                where.createdAt.lte = end;
            }
        }
        const total = await db_js_1.default.auditLog.count({ where });
        const logs = await db_js_1.default.auditLog.findMany({
            where,
            include: {
                actor: { select: { email: true } },
                tenant: { select: { name: true } },
            },
            orderBy: { createdAt: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        });
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({
            logs,
            total,
            page,
            totalPages,
        });
    }
    catch (error) {
        return res.status(500).json({ error: `Audit log retrieval error: ${error.message}` });
    }
});
/**
 * GET /api/superadmin/tenants
 * Retrieve list of all registered tenants/companies with staff and task counts.
 */
router.get('/tenants', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireSuperadmin, async (req, res) => {
    try {
        const tenantsList = await db_js_1.default.tenant.findMany({
            where: {
                id: { not: 0 } // Exclude global system tenant
            },
            include: {
                _count: {
                    select: {
                        users: { where: { deletedAt: null } },
                        tasks: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const formattedTenants = tenantsList.map(t => ({
            id: t.id,
            name: t.name,
            subscriptionTier: t.subscriptionTier,
            createdAt: t.createdAt,
            staffCount: t._count.users,
            tasksCount: t._count.tasks,
            supportAccessGrantedUntil: t.supportAccessGrantedUntil
        }));
        return res.status(200).json({ tenants: formattedTenants });
    }
    catch (error) {
        return res.status(500).json({ error: `Tenant list retrieval error: ${error.message}` });
    }
});
/**
 * PATCH /api/superadmin/tenants/:tenantId/subscription
 * Change subscription tier for a company (Superadmin only)
 */
router.patch('/tenants/:tenantId/subscription', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireSuperadmin, async (req, res) => {
    const tenantId = Number(req.params.tenantId);
    const { subscriptionTier } = req.body;
    if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'Invalid tenant ID.' });
    }
    const tier = Number(subscriptionTier);
    if (![1, 2, 3].includes(tier)) {
        return res.status(400).json({ error: 'Subscription tier must be 1, 2, or 3.' });
    }
    try {
        const updated = await db_js_1.default.tenant.update({
            where: { id: tenantId },
            data: { subscriptionTier: tier }
        });
        // Write audit log
        await db_js_1.default.auditLog.create({
            data: {
                tenantId: 0,
                actorId: req.user.userId,
                action: 'TENANT_TIER_UPDATE',
                entityType: 'Tenant',
                entityId: tenantId,
                metadata: JSON.stringify({ subscriptionTier: tier }),
            },
        });
        return res.status(200).json({ message: 'Subscription tier updated successfully.', tenant: updated });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/superadmin/tenants/:tenantId/reset-admin-password
 * Reset company administrator's password (Superadmin only)
 */
router.post('/tenants/:tenantId/reset-admin-password', auth_middleware_js_1.authenticateSession, auth_middleware_js_1.requireSuperadmin, async (req, res) => {
    const tenantId = Number(req.params.tenantId);
    const { newPassword } = req.body;
    if (isNaN(tenantId)) {
        return res.status(400).json({ error: 'Invalid tenant ID.' });
    }
    if (!newPassword || newPassword.length < 12 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
        return res.status(400).json({ error: 'Password must be at least 12 characters long and contain uppercase, lowercase, numbers, and symbols.' });
    }
    try {
        // Verify support access consent
        const tenant = await db_js_1.default.tenant.findUnique({
            where: { id: tenantId }
        });
        if (!tenant) {
            return res.status(404).json({ error: 'Organization not found.' });
        }
        const now = new Date();
        if (!tenant.supportAccessGrantedUntil || tenant.supportAccessGrantedUntil < now) {
            return res.status(403).json({ error: 'Access denied. The company has not granted active support consent.' });
        }
        // Find the company administrator (rank level 0) for this tenant
        const adminUser = await db_js_1.default.user.findFirst({
            where: {
                tenantId,
                rank: { level: 0 },
                deletedAt: null
            }
        });
        if (!adminUser) {
            return res.status(404).json({ error: 'Company administrator not found for this organization.' });
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await db_js_1.default.user.update({
            where: { id: adminUser.id },
            data: { passwordHash }
        });
        // Write audit log
        await db_js_1.default.auditLog.create({
            data: {
                tenantId: 0,
                actorId: req.user.userId,
                action: 'TENANT_ADMIN_PASSWORD_RESET',
                entityType: 'User',
                entityId: adminUser.id,
                metadata: JSON.stringify({ adminUserId: adminUser.id }),
            },
        });
        return res.status(200).json({ message: 'Company administrator password updated successfully.' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
