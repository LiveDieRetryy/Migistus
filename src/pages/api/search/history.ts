// src/pages/api/search/history.ts
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
        // Get user's search history
        const { limit } = req.query;
        const searchLimit = limit ? parseInt(limit as string) : 20;

        if (searchLimit < 1 || searchLimit > 100) {
          return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const history = await searchStorage.getUserSearchHistory(session.userId, searchLimit);
        return res.status(200).json({ history });
      }

      case 'DELETE': {
        // Clear user's search history
        await searchStorage.clearSearchHistory(session.userId);
        return res.status(200).json({ message: 'Search history cleared successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Search history API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
