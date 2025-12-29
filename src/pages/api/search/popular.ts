// src/pages/api/search/popular.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { limit } = req.query;
    const searchLimit = limit ? parseInt(limit as string) : 10;

    if (searchLimit < 1 || searchLimit > 50) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    const popular = await searchStorage.getPopularSearches(searchLimit);

    return res.status(200).json({ popularSearches: popular });
  } catch (error: any) {
    console.error('Popular searches API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
