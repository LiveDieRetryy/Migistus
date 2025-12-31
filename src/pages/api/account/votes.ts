import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authentication
  const session = await requireAuth(req, res);
  if (!session) {
    return; // requireAuth already sent the 401 response
  }

  try {
    if (req.method === 'GET') {
      // Get user's votes from database
      const userVotes = await db.getUserVotes(session.userId);
      
      return res.status(200).json({
        success: true,
        data: userVotes,
        total: userVotes.length
      });
    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User votes API error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}

