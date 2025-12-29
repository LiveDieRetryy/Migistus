// Admin endpoint to set a conversation to pending status for testing
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.userId !== 1 && session.tier !== 'Admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const conversationId = req.query.conversationId || req.body?.conversationId;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId required' });
    }

    await sql`
      UPDATE conversations 
      SET status = 'pending'
      WHERE id = ${conversationId}
    `;

    console.log(`[admin] Set conversation ${conversationId} to pending`);

    return res.status(200).json({
      success: true,
      message: `Conversation ${conversationId} set to pending`
    });
  } catch (error) {
    console.error('[admin] Error:', error);
    return res.status(500).json({ error: 'Failed to update conversation' });
  }
}
