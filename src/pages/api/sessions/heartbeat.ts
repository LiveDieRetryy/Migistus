import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest, updateSessionActivity } from '@/lib/session';

/**
 * Session heartbeat endpoint
 * Updates last_active timestamp to track online status
 * Call this periodically from the client (e.g., every 30 seconds)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPage } = req.body;

    // Update session activity
    await updateSessionActivity(session.userId, currentPage);

    return res.status(200).json({ 
      success: true,
      userId: session.userId,
      lastActive: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in heartbeat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
