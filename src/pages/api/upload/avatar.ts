import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => mimetype?.startsWith('image/') || false,
    });

    const [fields, files] = await form.parse(req);
    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;

    if (!avatarFile) {
      return res.status(400).json({ error: 'No avatar file provided' });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(avatarFile.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = avatarFile.originalFilename?.split('.').pop() || 'jpg';
    const filename = `avatars/${session.userId}_${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: avatarFile.mimetype || 'image/jpeg',
    });

    // Update user profile with new avatar URL
    await db.updateUserProfile(session.userId, {
      avatar: blob.url
    });

    // Also update main users table
    await db.updateUser(session.userId, {
      avatar: blob.url
    });

    res.status(200).json({
      success: true,
      avatarUrl: blob.url,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
}
