import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { getSession } from '@/lib/session';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.migistus_session;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { invisible } = req.body;

    // Store visibility preference in global map for quick access
    const visibilityMap = (global as any).visibilityMap || new Map();
    (global as any).visibilityMap = visibilityMap;
    visibilityMap.set(session.userId, invisible === true);

    // Also save to user profile for persistence
    try {
      const userProfile = UserStorage.getUserProfile(session.userId);
      if (userProfile) {
        userProfile.isInvisible = invisible === true;
        UserStorage.setUserProfile(session.userId, userProfile);
      }
    } catch (error) {
      console.error('Error saving invisible preference to profile:', error);
    }

    return res.status(200).json({ 
      success: true,
      userId: session.userId,
      invisible
    });
  } catch (error) {
    console.error('Error updating visibility:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
