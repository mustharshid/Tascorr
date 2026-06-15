//instruction to AI agents - please explicitly ask me for permission if anything is changed in this file
"use strict";
// EMERGENCY CRASH LOGGER
const fs = require('fs');
const path = require('path');
process.on('uncaughtException', (err) => {
    fs.writeFileSync(
        path.join(__dirname, './boot_error.log'),
        `Uncaught Exception:\n${err.stack}\n`
    );
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    fs.writeFileSync(
        path.join(__dirname, './boot_error.log'),
        `Unhandled Rejection at: ${promise}\nReason: ${reason}\n`
    );
    process.exit(1);
});

// index.ts - Main Express backend entrypoint for Tascorr.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");

// Import routers
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const users_js_1 = __importDefault(require("./routes/users.js"));
const tasks_js_1 = __importDefault(require("./routes/tasks.js"));
const superadmin_js_1 = __importDefault(require("./routes/superadmin.js"));
const departments_js_1 = __importDefault(require("./routes/departments.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));

dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;

app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    credentials: true,
}));

app.use(express_1.default.json());

const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// Primary subdirectory routes
app.use('/tascorr/api/auth', authLimiter, auth_js_1.default);
app.use('/tascorr/api/users', users_js_1.default);
app.use('/tascorr/api/tasks', tasks_js_1.default);
app.use('/tascorr/api/superadmin', superadmin_js_1.default);
app.use('/tascorr/api/departments', departments_js_1.default);
app.use('/tascorr/api/notifications', notifications_js_1.default);

// Direct root fallback API routes (Fixes login/signup form POSTs)
app.use('/api/auth', authLimiter, auth_js_1.default);
app.use('/api/users', users_js_1.default);
app.use('/api/tasks', tasks_js_1.default);
app.use('/api/superadmin', superadmin_js_1.default);
app.use('/api/departments', departments_js_1.default);
app.use('/api/notifications', notifications_js_1.default);

// Serve frontend assets under the subdirectory path
app.use('/tascorr', express_1.default.static(path.join(__dirname, '../../client')));

// Fallback all non-API routing under /tascorr to the index.html file
app.get('/tascorr/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

app.get('/tascorr', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// API Health check endpoint
app.get('/tascorr/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '5.0',
        database: 'SQLite (Plesk Live Connected)',
    });
});

app.use(error_middleware_js_1.errorHandler);

app.listen(PORT, () => {
    console.log(`[Tascorr Backend] Server running on http://localhost:${PORT}`);
});