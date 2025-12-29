import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@vercel/postgres';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.userId;
    const { messageId, deleteType } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }

    if (!deleteType || !['for-me', 'for-everyone'].includes(deleteType)) {
      return res.status(400).json({ error: 'Invalid delete type. Use "for-me" or "for-everyone"' });
    }

    // Get the message to verify ownership
    const message = await sql`
      SELECT sender_id, conversation_id FROM direct_messages
      WHERE id = ${messageId}
    `;

    if (message.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const senderId = typeof message.rows[0].sender_id === 'string' 
      ? parseInt(message.rows[0].sender_id) 
      : message.rows[0].sender_id;

    // For "delete for everyone", only the sender can do this
    if (deleteType === 'for-everyone' && senderId !== userId) {
      return res.status(403).json({ error: 'Only the sender can delete for everyone' });
    }

    if (deleteType === 'for-everyone') {
      // Hard delete - remove the message completely
      await sql`
        DELETE FROM direct_messages
        WHERE id = ${messageId}
      `;

      console.log(`[delete] User ${userId} deleted message ${messageId} for everyone`);

      return res.status(200).json({ 
        success: true, 
        message: 'Message deleted for everyone',
        deleteType: 'for-everyone'
      });
    } else {
      // Delete for me - add user to deleted_for array
      await sql`
        UPDATE direct_messages
        SET deleted_for = array_append(
          COALESCE(deleted_for, ARRAY[]::integer[]), 
          ${userId}
        )
        WHERE id = ${messageId}
        AND NOT (${userId} = ANY(COALESCE(deleted_for, ARRAY[]::integer[])))
      `;

      console.log(`[delete] User ${userId} deleted message ${messageId} for themselves`);

      // Check if both participants have now deleted the message
      // Get conversation participants
      const conversationId = message.rows[0].conversation_id;
      const conversation = await sql`
        SELECT user1_id, user2_id FROM conversations WHERE id = ${conversationId}
      `;

      if (conversation.rows.length > 0) {
        const user1Id = typeof conversation.rows[0].user1_id === 'string' 
          ? parseInt(conversation.rows[0].user1_id) 
          : conversation.rows[0].user1_id;
        const user2Id = typeof conversation.rows[0].user2_id === 'string' 
          ? parseInt(conversation.rows[0].user2_id) 
          : conversation.rows[0].user2_id;

        // Get updated message to check deleted_for array
        const updatedMessage = await sql`
          SELECT deleted_for FROM direct_messages WHERE id = ${messageId}
        `;

        if (updatedMessage.rows.length > 0) {
          const deletedFor = updatedMessage.rows[0].deleted_for || [];
          
          // Check if both users have deleted it
          const bothDeleted = deletedFor.includes(user1Id) && deletedFor.includes(user2Id);
          
          if (bothDeleted) {
            // Hard delete the message since both users deleted it
            await sql`DELETE FROM direct_messages WHERE id = ${messageId}`;
            console.log(`[delete] Message ${messageId} hard-deleted - both users deleted it`);
            
            return res.status(200).json({ 
              success: true, 
              message: 'Message deleted for you (and removed from server)',
              deleteType: 'for-me',
              hardDeleted: true
            });
          }
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Message deleted for you',
        deleteType: 'for-me'
      });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
}
