// src/pages/api/recently-viewed/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET': {
        // Get recently viewed items
        const { type, limit } = req.query;

        const entityType = type ? (type as string) : undefined;
        const viewLimit = limit ? parseInt(limit as string) : 20;

        if (viewLimit < 1 || viewLimit > 100) {
          return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const items = await searchStorage.getRecentlyViewed(
          session.userId,
          entityType,
          viewLimit
        );

        return res.status(200).json({ items });
      }

      case 'POST': {
        // Add item to recently viewed
        const { entityType, entityId } = req.body;

        if (!entityType || typeof entityType !== 'string') {
          return res.status(400).json({ error: 'Entity type is required' });
        }

        if (!entityId || isNaN(parseInt(entityId))) {
          return res.status(400).json({ error: 'Valid entity ID is required' });
        }

        const item = await searchStorage.addToRecentlyViewed(
          session.userId,
          entityType,
          parseInt(entityId)
        );

        // Also track view for trending
        await searchStorage.trackView({
          entityType,
          entityId: parseInt(entityId),
          userId: session.userId
        });

        return res.status(201).json({ item });
      }

      case 'DELETE': {
        // Clear recently viewed
        await searchStorage.clearRecentlyViewed(session.userId);
        return res.status(200).json({ message: 'Recently viewed cleared successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Recently viewed API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
