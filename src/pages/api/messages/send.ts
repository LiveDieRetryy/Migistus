// pages/api/messages/send.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { emitChatMessage } from '@/utils/socketEmitter';
import { getSessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';

// Helper function to check if user1 follows user2
async function checkIfFollowing(userId1: number, userId2: number): Promise<boolean> {
  try {
    return await db.isFollowing(userId1, userId2);
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = session.userId;

    const { conversationId, recipientId, content, replyToId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let finalConversationId = conversationId;
    let conversationStatus = 'accepted'; // Default status

    // If no conversationId (or empty string), create or find one
    if ((!conversationId || conversationId === '') && recipientId) {
      const existingConversation = await sql`
        SELECT id, status FROM conversations 
        WHERE (user1_id = ${userId} AND user2_id = ${recipientId}) 
        OR (user1_id = ${recipientId} AND user2_id = ${userId})
      `;

      if (existingConversation.rows.length > 0) {
        finalConversationId = existingConversation.rows[0].id;
        conversationStatus = existingConversation.rows[0].status || 'accepted';
      } else {
        // Check if recipient follows sender back
        const recipientFollowsSender = await checkIfFollowing(recipientId, userId);
        
        // If recipient doesn't follow sender, conversation is pending
        conversationStatus = recipientFollowsSender ? 'accepted' : 'pending';
        
        console.log(`[send] Creating NEW conversation:`);
        console.log(`  - Sender: ${userId}`);
        console.log(`  - Recipient: ${recipientId}`);
        console.log(`  - Recipient follows sender back: ${recipientFollowsSender}`);
        console.log(`  - Conversation status: ${conversationStatus}`);
        
        // Create new conversation with status (or without if column doesn't exist)
        try {
          const newConversation = await sql`
            INSERT INTO conversations (user1_id, user2_id, created_at, status, initiated_by) 
            VALUES (${userId}, ${recipientId}, NOW(), ${conversationStatus}, ${userId}) 
            RETURNING id
          `;
          finalConversationId = newConversation.rows[0].id;
        } catch (statusError: any) {
          // If status column doesn't exist, create without it
          if (statusError.message?.includes('column "status"') || statusError.message?.includes('column "initiated_by"')) {
            console.log('[send] Status column not found, creating conversation without status');
            const newConversation = await sql`
              INSERT INTO conversations (user1_id, user2_id, created_at) 
              VALUES (${userId}, ${recipientId}, NOW()) 
              RETURNING id
            `;
            finalConversationId = newConversation.rows[0].id;
          } else {
            throw statusError;
          }
        }
      }
    }

    // Verify user is part of this conversation
    if (!finalConversationId) {
      console.error('[send] No conversation ID available');
      return res.status(400).json({ error: 'No conversation ID' });
    }

    const conversation = await sql`
      SELECT * FROM conversations 
      WHERE id = ${finalConversationId} AND (user1_id = ${userId} OR user2_id = ${userId})
    `;

    console.log('[send] Conversation verification:', {
      conversationId: finalConversationId,
      userId,
      found: conversation.rows.length
    });

    if (conversation.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied - not part of conversation' });
    }

    // Insert message with optional reply
    const message = replyToId 
      ? await sql`
          INSERT INTO direct_messages (conversation_id, sender_id, content, created_at, read, reply_to_id) 
          VALUES (${finalConversationId}, ${userId}, ${content.trim()}, NOW(), false, ${replyToId}) 
          RETURNING id, sender_id, content, created_at, read, reply_to_id
        `
      : await sql`
          INSERT INTO direct_messages (conversation_id, sender_id, content, created_at, read) 
          VALUES (${finalConversationId}, ${userId}, ${content.trim()}, NOW(), false) 
          RETURNING id, sender_id, content, created_at, read
        `;

    // Update conversation last_message
    await sql`
      UPDATE conversations 
      SET last_message = ${content.trim().substring(0, 100)}, last_message_at = NOW() 
      WHERE id = ${finalConversationId}
    `;

    // Fetch reply message details if this is a reply
    let replyTo = null;
    if (replyToId) {
      const replyMessage = await sql`
        SELECT dm.id, dm.content, dm.sender_id, u.username 
        FROM direct_messages dm
        LEFT JOIN users u ON dm.sender_id = u.id
        WHERE dm.id = ${replyToId}
      `;
      
      if (replyMessage.rows.length > 0) {
        const reply = replyMessage.rows[0];
        replyTo = {
          id: reply.id,
          senderName: reply.username || 'Unknown',
          content: reply.content
        };
      }
    }

    const messageData = {
      id: message.rows[0].id,
      conversationId: finalConversationId.toString(),
      senderId: userId,
      senderName: session.username || 'Unknown',
      senderAvatar: null,
      content: message.rows[0].content,
      createdAt: message.rows[0].created_at,
      read: false,
      replyTo: replyTo
    };

    // Emit via Socket.IO
    try {
      emitChatMessage(messageData);
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError);
      // Continue anyway - message is saved
    }

    return res.status(201).json({ 
      message: messageData,
      conversationId: finalConversationId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
