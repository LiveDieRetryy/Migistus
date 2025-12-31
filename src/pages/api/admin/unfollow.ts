// Admin endpoint to remove a follow relationship for testing
import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.userId !== 1 && session.tier !== 'Admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId required' });
    }

    // Remove the follow relationship from database
    await db.unfollowUser(followerId, followingId);

    console.log(`[admin] Removed follow: ${followerId} -> ${followingId}`);

    return res.status(200).json({
      success: true,
      message: `Removed follow relationship: ${followerId} unfollowed ${followingId}`
    });
  } catch (error) {
    console.error('[admin] Error:', error);
    return res.status(500).json({ error: 'Failed to remove follow' });
  }
}
