// pages/api/messages/conversations.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.userId;
    const status = req.query.status as string; // 'accepted', 'pending', 'ignored', or undefined for all

    // Build query with optional status filter
    let conversations;
    try {
      if (status) {
        conversations = await sql`
          SELECT 
            c.id,
            c.user1_id,
            c.user2_id,
            c.last_message,
            c.last_message_at,
            c.status,
            c.initiated_by,
            CASE 
              WHEN c.user1_id = ${userId} THEN c.user2_id
              ELSE c.user1_id
            END as other_user_id,
            COALESCE(
              (SELECT COUNT(*) 
               FROM direct_messages 
               WHERE conversation_id = c.id 
               AND sender_id != ${userId} 
               AND read = false), 
              0
            ) as unread_count
          FROM conversations c
          WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
          AND COALESCE(c.status, 'accepted') = ${status}
          ORDER BY c.last_message_at DESC
        `;
      } else {
        conversations = await sql`
          SELECT 
            c.id,
            c.user1_id,
            c.user2_id,
            c.last_message,
            c.last_message_at,
            c.status,
            c.initiated_by,
            CASE 
              WHEN c.user1_id = ${userId} THEN c.user2_id
              ELSE c.user1_id
            END as other_user_id,
            COALESCE(
              (SELECT COUNT(*) 
               FROM direct_messages 
               WHERE conversation_id = c.id 
               AND sender_id != ${userId} 
               AND read = false), 
              0
            ) as unread_count
          FROM conversations c
          WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
          AND COALESCE(c.status, 'accepted') = 'accepted'
          ORDER BY c.last_message_at DESC
        `;
      }
    } catch (error) {
      // If status column doesn't exist, fetch without it
      console.log('[conversations] Status column not found, fetching all conversations');
      conversations = await sql`
        SELECT 
          c.id,
          c.user1_id,
          c.user2_id,
          c.last_message,
          c.last_message_at,
          CASE 
            WHEN c.user1_id = ${userId} THEN c.user2_id
            ELSE c.user1_id
          END as other_user_id,
          COALESCE(
            (SELECT COUNT(*) 
             FROM direct_messages 
             WHERE conversation_id = c.id 
             AND sender_id != ${userId} 
             AND read = false), 
            0
          ) as unread_count
        FROM conversations c
        WHERE (c.user1_id = ${userId} OR c.user2_id = ${userId})
        ORDER BY c.last_message_at DESC
      `;
    }

    console.log('[conversations] Found', conversations.rows.length, 'conversations for user', userId, 'with status:', status || 'accepted');

    // Get user details from database for all other_user_ids
    const otherUserIds = conversations.rows.map(row => 
      typeof row.other_user_id === 'string' ? parseInt(row.other_user_id) : row.other_user_id
    );
    
    const users = await Promise.all(
      otherUserIds.map(id => db.getUserById(id))
    );

    return res.status(200).json({
      conversations: conversations.rows
        .map((row, index) => {
          const otherUserId = otherUserIds[index];
          const user = users[index];

          return {
            id: row.id.toString(),
            otherUserId: otherUserId,
            otherUserName: user?.username || 'Unknown User',
            otherUserAvatar: user?.avatar || null,
            lastMessage: row.last_message || '',
            lastMessageAt: row.last_message_at,
            unreadCount: parseInt(row.unread_count) || 0,
            status: row.status || 'accepted',
            initiatedBy: row.initiated_by
          };
        })
        .filter(conv => conv.lastMessage) // Only show conversations with at least one message
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}
