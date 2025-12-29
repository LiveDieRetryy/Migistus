// src/pages/api/search/trending.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { type, limit, timeWindow } = req.query;

    const entityType = type ? (type as string) : undefined;
    const trendingLimit = limit ? parseInt(limit as string) : 20;
    const window = timeWindow ? parseInt(timeWindow as string) : 7;

    if (trendingLimit < 1 || trendingLimit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    if (window < 1 || window > 30) {
      return res.status(400).json({ error: 'Time window must be between 1 and 30 days' });
    }

    const trending = await searchStorage.getTrendingContent(entityType, trendingLimit, window);

    return res.status(200).json({ trending, timeWindow: window });
  } catch (error: any) {
    console.error('Trending API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
