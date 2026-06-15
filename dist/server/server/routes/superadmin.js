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
        const logs = await db_js_1.default.auditLog.findMany({
            include: {
                actor: { select: { email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ logs });
    }
    catch (error) {
        return res.status(500).json({ error: `Audit log retrieval error: ${error.message}` });
    }
});
exports.default = router;
