"use strict";
// index.ts - Main Express backend entrypoint for Tascorr.
// Establishes API listeners, middleware configurations, and health verification routes.
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
const uploads_js_1 = __importDefault(require("./routes/uploads.js"));
// Load environment configurations
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5005;
// Verify JWT_SECRET security status
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'replace-with-a-very-secure-random-256-bit-key-for-production') {
    console.warn('\n[WARNING] [SECURITY] JWT_SECRET is not configured or is set to a default value.');
    console.warn('Please define a secure JWT_SECRET environment variable in production!\n');
}
// Enable secure headers with Helmet
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for easy setup
}));
// Configure CORS for production deployment
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://127.0.0.1:5173']; // default vite development port
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
    credentials: true,
}));
// Enable JSON body parser middleware with 5mb limit for avatars
app.use(express_1.default.json({ limit: '5mb' }));
// Set up rate limiter for authentication endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
});
// Mount API routes
app.use('/api/auth', authLimiter, auth_js_1.default);
app.use('/api/users', users_js_1.default);
app.use('/api/tasks', tasks_js_1.default);
app.use('/api/superadmin', superadmin_js_1.default);
app.use('/api/departments', departments_js_1.default);
app.use('/api/notifications', notifications_js_1.default);
app.use('/api/upload', uploads_js_1.default);
// API Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '5.0',
        database: 'MySQL (Plesk Connected)',
    });
});
// Mount global error handler middleware (must be after all routes)
app.use(error_middleware_js_1.errorHandler);
// Start Express server listening on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const lanIp = Object.values(nets).flat()
        .find((n) => n.family === 'IPv4' && !n.internal)?.address || 'unknown';
    console.log(`[Tascorr Backend] Server running on http://localhost:${PORT}`);
    console.log(`[Tascorr Backend] Network access:  http://${lanIp}:${PORT}`);
    console.log(`[Tascorr Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});
