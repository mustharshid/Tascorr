import { Request, Response, NextFunction } from 'express';
import { IAuthSession } from '../../shared/types.js';
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
export declare function authenticateSession(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Assert that the request comes from an authenticated Company Administrator (rank 0 equivalent context)
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Assert that the request comes from the Global Superadmin (who is tenant-isolated above workspaces)
 * Superadmin has tenantId: 0
 */
export declare function requireSuperadmin(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
