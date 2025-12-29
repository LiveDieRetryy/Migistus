// pages/api/messages/unread-count.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Count unread messages across all conversations
    const result = await sql`
      SELECT COUNT(*) as count
      FROM direct_messages dm
      JOIN conversations c ON dm.conversation_id = c.id
      WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
      AND dm.sender_id != ${userId}
      AND dm.read = false
    `;

    const count = parseInt(result.rows[0].count);

    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}
