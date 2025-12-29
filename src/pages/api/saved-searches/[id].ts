// src/pages/api/saved-searches/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { searchStorage } from '@/utils/searchStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const searchId = parseInt(req.query.id as string);
    if (isNaN(searchId)) {
      return res.status(400).json({ error: 'Invalid saved search ID' });
    }

    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    // Delete saved search
    await searchStorage.deleteSavedSearch(searchId, session.userId);
    return res.status(200).json({ message: 'Saved search deleted successfully' });
  } catch (error: any) {
    console.error('Saved search delete API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
