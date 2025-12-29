import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const followers = await db.getFollowers(parseInt(userId));
    const following = await db.getFollowing(parseInt(userId));

    // Get session to check if current user is following
    const session = await getSessionFromRequest(req);
    let isFollowing = false;
    
    if (session?.userId) {
      isFollowing = await db.isFollowing(session.userId, parseInt(userId));
    }

    return res.status(200).json({ 
      followers, 
      following,
      isFollowing 
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
}
