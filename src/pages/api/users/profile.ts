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
      // Get profile data
      const profile = await db.getUserProfile(userId);
      const stats = await db.getUserStats(userId);
      const settings = await db.getUserSettings(userId);

      // If profile doesn't exist, create it
      if (!profile) {
        await db.createUserProfile(userId, {});
        await db.createUserStats(userId);
        await db.createUserSettings(userId);
        
        return res.status(200).json({
          profile: await db.getUserProfile(userId),
          stats: await db.getUserStats(userId),
          settings: await db.getUserSettings(userId)
        });
      }

      return res.status(200).json({ profile, stats, settings });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { bio, avatar, banner, badges, titles, links, isInvisible } = req.body;

      const profile = await db.updateUserProfile(userId, {
        bio,
        avatar,
        banner,
        badges,
        titles,
        links,
        isInvisible
      });

      return res.status(200).json({ profile });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
