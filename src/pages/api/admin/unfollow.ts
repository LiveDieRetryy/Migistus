// Admin endpoint to remove a follow relationship for testing
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/session';

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

    const followersPath = path.join(process.cwd(), 'public', 'data', 'followers.json');
    const followersData = JSON.parse(fs.readFileSync(followersPath, 'utf-8'));

    // Remove the follow relationship
    followersData.follows = followersData.follows.filter((follow: any) => 
      !(follow.followerId === followerId && follow.followingId === followingId)
    );

    fs.writeFileSync(followersPath, JSON.stringify(followersData, null, 2));

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
