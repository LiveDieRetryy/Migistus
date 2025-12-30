// pages/api/messages/conversation.ts - Get messages for a conversation (query param)
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Fetch messages
  if (req.method === 'GET') {
    return handleGetMessages(req, res);
  }

  // PUT - Edit message
  if (req.method === 'PUT') {
    return handleEditMessage(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGetMessages(req: NextApiRequest, res: NextApiResponse) {

  try {
    const conversationId = req.query.id as string;
    
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.userId;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    // Verify user is part of this conversation
    const conversation = await sql`
      SELECT * FROM conversations 
      WHERE id = ${conversationId} AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    if (conversation.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Load users from JSON file (users are stored in JSON, not DB)
    let jsonUsers: any[] = [];
    try {
      const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      jsonUsers = usersData.users || [];
      console.log('[conversation] Loaded', jsonUsers.length, 'users from JSON');
    } catch (err) {
      console.error('[conversation] Error reading users JSON:', err);
    }

    // Fetch messages (without user join since users are in JSON)
    // Try to use deleted_for column if it exists, otherwise just fetch all messages
    let messages;
    try {
      messages = await sql`
        SELECT 
          dm.id,
          dm.sender_id,
          dm.content,
          dm.created_at,
          dm.read,
          dm.deleted_for,
          dm.reactions,
          dm.reply_to_id,
          dm.edited,
          dm.edited_at,
          reply_msg.sender_id as reply_sender_id,
          reply_msg.content as reply_content
        FROM direct_messages dm
        LEFT JOIN direct_messages reply_msg ON dm.reply_to_id = reply_msg.id
        WHERE dm.conversation_id = ${conversationId}
        AND NOT (${userId} = ANY(COALESCE(dm.deleted_for, ARRAY[]::integer[])))
        ORDER BY dm.created_at ASC
      `;
    } catch (error) {
      // If deleted_for or reactions column doesn't exist yet, fetch without it
      console.log('[conversation] Column not found, fetching with fallback');
      try {
        messages = await sql`
          SELECT 
            dm.id,
            dm.sender_id,
            dm.content,
            dm.created_at,
            dm.read,
            dm.reactions
          FROM direct_messages dm
          WHERE dm.conversation_id = ${conversationId}
          ORDER BY dm.created_at ASC
        `;
      } catch {
        messages = await sql`
          SELECT 
            dm.id,
            dm.sender_id,
            dm.content,
            dm.created_at,
            dm.read
          FROM direct_messages dm
          WHERE dm.conversation_id = ${conversationId}
          ORDER BY dm.created_at ASC
        `;
      }
    }

    console.log('[conversation] Found', messages.rows.length, 'messages');
    if (messages.rows.length > 0) {
      console.log('[conversation] First message sender_id:', messages.rows[0].sender_id, 'type:', typeof messages.rows[0].sender_id);
    }

    // Mark messages as read
    await sql`
      UPDATE direct_messages 
      SET read = true 
      WHERE conversation_id = ${conversationId} AND sender_id != ${userId} AND read = false
    `;

    return res.status(200).json({
      messages: messages.rows.map(row => {
        // Convert sender_id to number (PostgreSQL returns it as string)
        const senderId = typeof row.sender_id === 'string' ? parseInt(row.sender_id) : row.sender_id;
        
        // Get sender info from JSON users - match by numeric ID
        const sender = jsonUsers.find((u: any) => u.id === senderId);

        if (!sender) {
          console.log('[conversation] Could not find user for sender_id:', senderId, 'type:', typeof senderId);
        }

        // Parse reply data if exists
        let replyTo = null;
        if (row.reply_to_id && row.reply_content) {
          const replySenderId = typeof row.reply_sender_id === 'string' ? parseInt(row.reply_sender_id) : row.reply_sender_id;
          const replySender = jsonUsers.find((u: any) => u.id === replySenderId);
          replyTo = {
            id: row.reply_to_id,
            senderName: replySender?.username || 'Unknown',
            content: row.reply_content
          };
        }

        // Parse reactions if it's a JSON string
        let reactions = row.reactions || [];
        if (typeof reactions === 'string') {
          try {
            reactions = JSON.parse(reactions);
          } catch {
            reactions = [];
          }
        }

        return {
          id: row.id.toString(),
          senderId: senderId,
          senderName: sender?.username || 'Unknown User',
          senderAvatar: sender?.avatar || null,
          content: row.content,
          createdAt: row.created_at,
          read: row.read,
          edited: row.edited || false,
          editedAt: row.edited_at || null,
          reactions: reactions,
          replyTo: replyTo,
          attachments: []
        };
      })
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function handleEditMessage(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { messageId, content } = req.body;

    if (!messageId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Message ID and content required' });
    }

    const userId = session.userId;

    // Check message exists and belongs to user
    const message = await sql`
      SELECT * FROM direct_messages 
      WHERE id = ${messageId} AND sender_id = ${userId}
    `;

    if (message.rows.length === 0) {
      return res.status(403).json({ error: 'Message not found or access denied' });
    }

    // Update message with edited flag
    const updated = await sql`
      UPDATE direct_messages 
      SET content = ${content.trim()},
          edited = true,
          edited_at = NOW()
      WHERE id = ${messageId} AND sender_id = ${userId}
      RETURNING *
    `;

    if (updated.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update message' });
    }

    return res.status(200).json({
      success: true,
      message: updated.rows[0]
    });
  } catch (error) {
    console.error('Error editing message:', error);
    return res.status(500).json({ error: 'Failed to edit message' });
  }
}
