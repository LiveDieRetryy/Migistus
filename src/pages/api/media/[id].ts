import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);

    const { id } = req.query;
    const mediaId = parseInt(id as string);

    if (isNaN(mediaId)) {
      return res.status(400).json({ error: 'Invalid media ID' });
    }

    if (req.method === 'GET') {
      // Get media details
      const media = await cmsStorage.getMedia(mediaId);

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      return res.status(200).json({ media });

    } else if (req.method === 'PATCH') {
      // Update media metadata
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const media = await cmsStorage.getMedia(mediaId);

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Check permissions
      if (media.uploadedBy !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { alt, caption, filename } = req.body;

      const updates: any = {};
      if (alt !== undefined) updates.alt = alt;
      if (caption !== undefined) updates.caption = caption;
      if (filename !== undefined) updates.filename = filename;

      const updatedMedia = await cmsStorage.updateMedia(mediaId, updates);

      return res.status(200).json({ media: updatedMedia });

    } else if (req.method === 'DELETE') {
      // Delete media
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const media = await cmsStorage.getMedia(mediaId);

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Check permissions
      if (media.uploadedBy !== session.userId && session.tier !== 'master' && session.tier !== 'migistus') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await cmsStorage.deleteMedia(mediaId);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Media detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
