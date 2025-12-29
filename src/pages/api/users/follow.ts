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

  const followerId = session.userId;

  if (req.method === 'POST') {
    try {
      const { userId: followingId } = req.body;

      if (!followingId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (followerId === followingId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      const result = await db.followUser(followerId, followingId);
      return res.status(200).json({ success: true, follow: result });
    } catch (error) {
      console.error('Error following user:', error);
      return res.status(500).json({ error: 'Failed to follow user' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId: followingId } = req.body;

      if (!followingId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const result = await db.unfollowUser(followerId, followingId);
      return res.status(200).json({ success: true, unfollow: result });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
