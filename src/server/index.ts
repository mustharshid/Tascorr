// index.ts - Main Express backend entrypoint for Tascorr.
// Establishes API listeners, middleware configurations, and health verification routes.

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';

// Import routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import tasksRouter from './routes/tasks.js';
import superadminRouter from './routes/superadmin.js';
import departmentsRouter from './routes/departments.js';
import notificationsRouter from './routes/notifications.js';
import uploadsRouter from './routes/uploads.js';

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5005;

// Verify JWT_SECRET security status
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'replace-with-a-very-secure-random-256-bit-key-for-production') {
  console.warn('\n[WARNING] [SECURITY] JWT_SECRET is not configured or is set to a default value.');
  console.warn('Please define a secure JWT_SECRET environment variable in production!\n');
}

// Enable secure headers with Helmet
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in dev for easy setup
}));

// Configure CORS for production deployment
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173']; // default vite development port

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
  credentials: true,
}));

// Enable JSON body parser middleware with 5mb limit for avatars
app.use(express.json({ limit: '5mb' }));

// Set up rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Mount API routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/superadmin', superadminRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/upload', uploadsRouter);

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
app.use(errorHandler);

// Start Express server listening on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const lanIp = (Object.values(nets).flat() as any[])
    .find((n: any) => n.family === 'IPv4' && !n.internal)?.address || 'unknown';

  console.log(`[Tascorr Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Tascorr Backend] Network access:  http://${lanIp}:${PORT}`);
  console.log(`[Tascorr Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
});

