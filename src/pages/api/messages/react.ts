// pages/api/messages/react.ts
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
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
      return res.status(400).json({ error: 'Message ID and emoji required' });
    }

    // Get current reactions
    const message = await sql`
      SELECT reactions FROM direct_messages WHERE id = ${messageId}
    `;

    if (message.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    let reactions = message.rows[0].reactions || [];
    
    // Parse reactions if it's a string (JSONB from database)
    if (typeof reactions === 'string') {
      try {
        reactions = JSON.parse(reactions);
      } catch {
        reactions = [];
      }
    }

    // Find if this emoji already exists
    const emojiIndex = reactions.findIndex((r: any) => r.emoji === emoji);

    if (emojiIndex !== -1) {
      // Emoji exists, toggle user's reaction
      const userIndex = reactions[emojiIndex].users.indexOf(userId);
      
      if (userIndex !== -1) {
        // User already reacted with this emoji, remove their reaction
        reactions[emojiIndex].users.splice(userIndex, 1);
        
        // If no users left with this emoji, remove the emoji entirely
        if (reactions[emojiIndex].users.length === 0) {
          reactions.splice(emojiIndex, 1);
        }
      } else {
        // User hasn't reacted with this emoji, add them
        reactions[emojiIndex].users.push(userId);
      }
    } else {
      // New emoji, add it with this user
      reactions.push({
        emoji: emoji,
        users: [userId]
      });
    }

    // Update the message with new reactions
    await sql`
      UPDATE direct_messages 
      SET reactions = ${JSON.stringify(reactions)}
      WHERE id = ${messageId}
    `;

    console.log(`[react] User ${userId} reacted to message ${messageId} with ${emoji}`);

    return res.status(200).json({ 
      success: true,
      reactions: reactions
    });
  } catch (error) {
    console.error('Error updating reaction:', error);
    return res.status(500).json({ error: 'Failed to update reaction' });
  }
}
