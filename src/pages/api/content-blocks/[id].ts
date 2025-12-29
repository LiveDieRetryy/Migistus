import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/auth';
import { cmsStorage } from '@/utils/cmsStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const blockId = parseInt(id as string);

    if (isNaN(blockId)) {
      return res.status(400).json({ error: 'Invalid block ID' });
    }

    if (req.method === 'GET') {
      // Get content block details
      const block = await cmsStorage.getContentBlock(blockId);

      if (!block) {
        return res.status(404).json({ error: 'Content block not found' });
      }

      return res.status(200).json({ block });

    } else if (req.method === 'PATCH') {
      // Update content block
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const block = await cmsStorage.getContentBlock(blockId);

      if (!block) {
        return res.status(404).json({ error: 'Content block not found' });
      }

      const { name, content, isGlobal } = req.body;

      const updates: any = {};

      if (name !== undefined) {
        if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
          return res.status(400).json({ error: 'Name must be 1-100 characters' });
        }
        updates.name = name;
      }

      if (content !== undefined) updates.content = content;
      if (isGlobal !== undefined) updates.isGlobal = isGlobal;

      const updatedBlock = await cmsStorage.updateContentBlock(blockId, updates);

      return res.status(200).json({ block: updatedBlock });

    } else if (req.method === 'DELETE') {
      // Delete content block
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const block = await cmsStorage.getContentBlock(blockId);

      if (!block) {
        return res.status(404).json({ error: 'Content block not found' });
      }

      await cmsStorage.deleteContentBlock(blockId);

      return res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Content block detail API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
