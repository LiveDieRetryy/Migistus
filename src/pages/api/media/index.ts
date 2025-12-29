import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);

    if (req.method === 'GET') {
      // Get media list with filtering
      const { mimeType, uploadedBy, limit = '50', offset = '0' } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const filters: any = { limit: limitNum, offset: offsetNum };

      if (mimeType && typeof mimeType === 'string') {
        filters.mimeType = mimeType;
      }
      if (uploadedBy) {
        filters.uploadedBy = parseInt(uploadedBy as string);
      }

      const media = await cmsStorage.getMediaList(filters);
      return res.status(200).json({ media });

    } else if (req.method === 'POST') {
      // Upload media (requires authentication)
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { filename, originalName, mimeType, size, url, alt, caption } = req.body;

      // Validation
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Filename is required' });
      }

      if (!originalName || typeof originalName !== 'string') {
        return res.status(400).json({ error: 'Original name is required' });
      }

      if (!mimeType || typeof mimeType !== 'string') {
        return res.status(400).json({ error: 'MIME type is required' });
      }

      if (!size || typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'Invalid file size' });
      }

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL is required' });
      }

      // File size limit (50MB)
      const MAX_SIZE = 50 * 1024 * 1024;
      if (size > MAX_SIZE) {
        return res.status(400).json({ error: 'File size exceeds 50MB limit' });
      }

      const media = await cmsStorage.createMedia({
        filename,
        originalName,
        mimeType,
        size,
        url,
        uploadedBy: session.userId,
        alt: alt || null,
        caption: caption || null
      });

      return res.status(201).json({ media });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Media API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
