import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.userId;
    const conversationId = req.query.id as string;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    // Get conversation details (simplified without user joins)
    const conversation = await sql`
      SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.last_message,
        c.last_message_at,
        CASE 
          WHEN c.user1_id = ${userId} THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id
      FROM conversations c
      WHERE c.id = ${conversationId}
      AND (c.user1_id = ${userId} OR c.user2_id = ${userId})
    `;

    if (conversation.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conv = conversation.rows[0];

    console.log('[conversation-info] Raw DB result:', {
      id: conv.id,
      user1_id: conv.user1_id,
      user2_id: conv.user2_id,
      other_user_id: conv.other_user_id,
      requestingUserId: userId
    });

    // Get username from JSON users file
    let otherUserName = 'Unknown User';
    const otherUserId = conv.other_user_id;

    if (otherUserId) {
      try {
        const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        const jsonUser = usersData.users.find((u: any) => {
          const jsonUserId = typeof u.id === 'string' ? parseInt(u.id) : u.id;
          return jsonUserId === otherUserId;
        });
        if (jsonUser) {
          otherUserName = jsonUser.username;
          console.log('[conversation-info] Found username in JSON:', otherUserName);
        }
      } catch (err) {
        console.error('[conversation-info] Error reading users JSON:', err);
      }
    }

    const response = {
      id: conv.id.toString(),
      otherUserId: otherUserId,
      otherUserName: otherUserName,
      otherUserAvatar: null,
      lastMessage: conv.last_message || 'No messages yet',
      lastMessageAt: conv.last_message_at
    };

    console.log('[conversation-info] Sending response:', response);

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching conversation info:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
}
