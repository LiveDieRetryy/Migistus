import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAuth(req, res);
  if (!session) {
    return;
  }

  try {
    if (req.method === 'GET') {
      const profile = await db.getUserProfile(session.userId);
      res.status(200).json(profile || null);
    } else if (req.method === 'PUT') {
      const updatedProfile = req.body;
      const profile = await db.updateUserProfile(session.userId, updatedProfile);
      res.status(200).json({ success: true, profile });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

