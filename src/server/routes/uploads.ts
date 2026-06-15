import { Router, Request, Response } from 'express';
import { authenticateSession, requireAdmin } from '../middleware/auth.middleware.js';
import fs from 'fs';
import path from 'path';
import prisma from '../services/db.js';

const router = Router();
const AVATARS_DIR = path.resolve(process.cwd(), 'public', 'avatars');

// Ensure directory exists
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

/**
 * POST /api/upload/avatar
 * Upload an avatar for the current user or a specific user (if admin)
 */
router.post('/avatar', authenticateSession, async (req: Request, res: Response) => {
  try {
    const { imageBase64, targetUserId } = req.body;
    
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URI.' });
    }

    const userId = targetUserId && req.user!.rankLevel === 0 ? targetUserId : req.user!.userId;
    const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 encoding.' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    
    // Validate size (e.g. max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 5MB size limit.' });
    }

    // Save as JPEG to standardize or keep original. We'll use a standard .jpg extension for simplicity, 
    // even if it's png, browsers will infer the mime type from content.
    const filename = `user-${userId}.jpg`;
    const filepath = path.join(AVATARS_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    return res.status(200).json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl: `/avatars/${filename}?t=${Date.now()}` // add timestamp to bust cache
    });

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: 'Failed to process avatar upload.' });
  }
});

/**
 * POST /api/upload/tenant-logo
 * Upload a logo for the current tenant (Admin only)
 */
router.post('/tenant-logo', authenticateSession, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    
    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URI.' });
    }

    const tenantId = req.user!.tenantId;
    const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 encoding.' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds 5MB size limit.' });
    }

    const filename = `tenant-${tenantId}.jpg`;
    const filepath = path.join(AVATARS_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    const logoUrl = `/avatars/${filename}`;
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl }
    });

    return res.status(200).json({ 
      message: 'Company logo uploaded successfully',
      logoUrl: `${logoUrl}?t=${Date.now()}` 
    });

  } catch (error: any) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: 'Failed to process logo upload.' });
  }
});

export default router;
