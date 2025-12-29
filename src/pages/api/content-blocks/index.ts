import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get content blocks with filtering
      const { type, isGlobal, limit = '50', offset = '0' } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit as string) || 50, 1), 100);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      const filters: any = { limit: limitNum, offset: offsetNum };

      if (type && typeof type === 'string') filters.type = type;
      if (isGlobal !== undefined) filters.isGlobal = isGlobal === 'true';

      const blocks = await cmsStorage.getContentBlocks(filters);
      return res.status(200).json({ blocks });

    } else if (req.method === 'POST') {
      // Create content block (requires authentication)
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, type, content, isGlobal } = req.body;

      // Validation
      if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
        return res.status(400).json({ error: 'Name must be 1-100 characters' });
      }

      if (!type || typeof type !== 'string' || !['text', 'html', 'image', 'video', 'widget', 'custom'].includes(type)) {
        return res.status(400).json({ error: 'Invalid block type' });
      }

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const block = await cmsStorage.createContentBlock({
        name,
        type,
        content,
        isGlobal: isGlobal === true
      });

      return res.status(201).json({ block });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Content blocks API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
