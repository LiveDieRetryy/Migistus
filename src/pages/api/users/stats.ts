import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSessionFromRequest(req);

  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.userId;

  if (req.method === 'GET') {
    try {
      let stats = await db.getUserStats(userId);
      
      // Create default stats if they don't exist
      if (!stats) {
        stats = await db.createUserStats(userId);
      }

      return res.status(200).json({ stats });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
