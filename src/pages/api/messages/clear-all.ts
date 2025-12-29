import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow admin users to clear all messages
    if (session.userId !== 1 && session.tier !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    console.log('[clear-all] Admin user attempting to clear messages:', session.userId, session.tier);

    // Delete all messages and conversations
    await sql`DELETE FROM direct_messages`;
    await sql`DELETE FROM conversations`;

    console.log('[clear-all] All messages and conversations deleted by admin');

    return res.status(200).json({ 
      success: true,
      message: 'All messages and conversations cleared'
    });
  } catch (error) {
    console.error('[clear-all] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
