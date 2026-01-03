import type { NextApiRequest, NextApiResponse } from 'next';
import { put, del } from '@vercel/blob';
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
    // Get current banner URL from database to delete old one
    const currentProfile = await db.getUserProfile(session.userId);
    const oldBannerUrl = currentProfile?.banner;

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB for banners
      filter: ({ mimetype }) => mimetype?.startsWith('image/') || false,
    });

    const [fields, files] = await form.parse(req);
    const bannerFile = Array.isArray(files.banner) ? files.banner[0] : files.banner;

    if (!bannerFile) {
      return res.status(400).json({ error: 'No banner file provided' });
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(bannerFile.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = bannerFile.originalFilename?.split('.').pop() || 'jpg';
    const filename = `banners/${session.userId}_${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: bannerFile.mimetype || 'image/jpeg',
    });

    // Delete old banner from Vercel Blob if it exists and is a blob URL
    if (oldBannerUrl && oldBannerUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(oldBannerUrl);
        console.log('✅ Deleted old banner:', oldBannerUrl);
      } catch (error) {
        console.warn('⚠️ Failed to delete old banner:', error);
        // Don't fail the request if deletion fails
      }
    }

    // Update user profile with new banner URL
    await db.updateUserProfile(session.userId, {
      banner: blob.url
    });

    res.status(200).json({
      success: true,
      bannerUrl: blob.url,
      message: 'Banner uploaded successfully'
    });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
}
