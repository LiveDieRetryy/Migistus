import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.userId;
    const { conversationId, action } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    if (!action || !['accept', 'ignore'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "accept" or "ignore"' });
    }

    // Verify user is part of this conversation
    const conversation = await sql`
      SELECT * FROM conversations 
      WHERE id = ${conversationId} 
      AND (user1_id = ${userId} OR user2_id = ${userId})
      AND status = 'pending'
    `;

    if (conversation.rows.length === 0) {
      return res.status(404).json({ error: 'Pending conversation not found' });
    }

    // Update status
    const newStatus = action === 'accept' ? 'accepted' : 'ignored';
    await sql`
      UPDATE conversations 
      SET status = ${newStatus}
      WHERE id = ${conversationId}
    `;

    console.log(`[message-request] User ${userId} ${action}ed conversation ${conversationId}`);

    return res.status(200).json({ 
      success: true, 
      message: `Message request ${action}ed`,
      status: newStatus
    });
  } catch (error) {
    console.error('Error updating message request:', error);
    return res.status(500).json({ error: 'Failed to update message request' });
  }
}
