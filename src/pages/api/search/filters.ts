// src/pages/api/search/filters.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Entity type is required' });
    }

    const validTypes = ['product', 'user', 'post', 'message', 'conversation'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid entity type', 
        validTypes 
      });
    }

    const filters = await searchStorage.getAvailableFilters(type);

    return res.status(200).json({ filters, entityType: type });
  } catch (error: any) {
    console.error('Search filters API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
