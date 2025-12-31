import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get all product votes (not community poll votes)
    const votes = await db.getVotes();
    res.status(200).json({ votes });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
}
