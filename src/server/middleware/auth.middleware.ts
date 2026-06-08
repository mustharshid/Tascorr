// auth.middleware.ts - Middlewares for extracting JWT sessions and validating authorization.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthSession } from '../../shared/types.js';

// Extend Request type definition to include session user payload
declare global {
  namespace Express {
    interface Request {
      user?: IAuthSession;
    }
  }
}

/**
 * Extracts and verifies JWT cookie or Authorization Bearer token header
 */
export function authenticateSession(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Try to read from authorization bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Try to read from cookies
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.split('=')[1].trim();
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No active session token found.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'replace-with-a-very-secure-random-256-bit-key-for-production';
    const decoded = jwt.verify(token, jwtSecret) as IAuthSession;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Assert that the request comes from an authenticated Company Administrator (rank 0 equivalent context)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // Check if rankLevel represents company admin (level 0 or explicit admin checker)
  // According to Section 3.5: "full access to corporate workspace"
  // Let's check if user rankLevel is 0 (Admin level is pre-defined or 0 in numerical context)
  if (req.user.rankLevel !== 0) {
    return res.status(403).json({ error: 'Access denied. Company administrator permissions required.' });
  }
  next();
}

/**
 * Assert that the request comes from the Global Superadmin (who is tenant-isolated above workspaces)
 * Superadmin has tenantId: 0
 */
export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.tenantId !== 0) {
    return res.status(403).json({ error: 'Access denied. Global superadmin permissions required.' });
  }
  next();
}
