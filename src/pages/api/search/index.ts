// src/pages/api/search/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { q, type, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    if (q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query cannot be empty' });
    }

    const entityTypes = type ? (Array.isArray(type) ? type : [type]) as string[] : undefined;
    const searchLimit = limit ? parseInt(limit as string) : 20;

    if (searchLimit < 1 || searchLimit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const startTime = Date.now();
    const results = await searchStorage.searchContent(q, entityTypes, searchLimit);
    const searchDuration = Date.now() - startTime;

    // Track search analytics
    const session = await getSessionFromRequest(req);
    if (session) {
      await searchStorage.saveSearchQuery(session.userId, q, results.length);
      
      // Track detailed analytics (non-blocking)
      searchStorage.trackSearchAnalytics({
        userId: session.userId,
        query: q,
        resultCount: results.length,
        clickedResults: [],
        searchDuration
      }).catch(err => console.error('Failed to track analytics:', err));
    }

    return res.status(200).json({
      query: q,
      results,
      count: results.length,
      duration: searchDuration
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
