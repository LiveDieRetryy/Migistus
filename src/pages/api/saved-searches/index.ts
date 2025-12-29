// src/pages/api/saved-searches/index.ts
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
        // Get user's saved searches
        const savedSearches = await searchStorage.getSavedSearches(session.userId);
        return res.status(200).json({ savedSearches });
      }

      case 'POST': {
        // Save a new search
        const { name, query, filters } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: 'Name is required' });
        }

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          return res.status(400).json({ error: 'Query is required' });
        }

        if (name.length > 100) {
          return res.status(400).json({ error: 'Name must be less than 100 characters' });
        }

        const savedSearch = await searchStorage.saveSearch(
          session.userId,
          name.trim(),
          query.trim(),
          filters || undefined
        );

        return res.status(201).json({ savedSearch });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Saved searches API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
