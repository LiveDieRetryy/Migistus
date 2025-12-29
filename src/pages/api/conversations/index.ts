// src/pages/api/conversations/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { chatStorage } from '@/utils/chatStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.userId;

    switch (req.method) {
      case 'GET': {
        // Get user's conversations
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        if (limit < 1 || limit > 100) {
          return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        const conversations = await chatStorage.getUserConversations(userId, limit, offset);
        
        // Add unread count for each conversation
        const conversationsWithUnread = await Promise.all(
          conversations.map(async (conv: any) => {
            const unreadCount = await chatStorage.getUnreadMessageCount(userId, conv.id);
            return { ...conv, unread_count: unreadCount };
          })
        );

        return res.status(200).json({ conversations: conversationsWithUnread });
      }

      case 'POST': {
        // Create new conversation
        const { type, name, participantIds } = req.body;

        if (!type || !['direct', 'group'].includes(type)) {
          return res.status(400).json({ error: 'Type must be "direct" or "group"' });
        }

        if (!Array.isArray(participantIds) || participantIds.length === 0) {
          return res.status(400).json({ error: 'Participant IDs must be a non-empty array' });
        }

        // Validate all participant IDs are numbers
        const validParticipantIds = participantIds.every(
          (id: any) => typeof id === 'number' || !isNaN(parseInt(id))
        );
        if (!validParticipantIds) {
          return res.status(400).json({ error: 'All participant IDs must be valid numbers' });
        }

        const parsedParticipantIds = participantIds.map((id: any) => 
          typeof id === 'number' ? id : parseInt(id)
        );

        // Ensure creator is in participants
        if (!parsedParticipantIds.includes(userId)) {
          parsedParticipantIds.push(userId);
        }

        // Validate group name
        if (type === 'group' && (!name || name.trim().length === 0)) {
          return res.status(400).json({ error: 'Group conversations must have a name' });
        }

        // Validate direct conversation
        if (type === 'direct' && parsedParticipantIds.length !== 2) {
          return res.status(400).json({ error: 'Direct conversations must have exactly 2 participants' });
        }

        const conversation = await chatStorage.createConversation({
          type,
          name: name?.trim(),
          createdBy: userId,
          participantIds: parsedParticipantIds
        });

        return res.status(201).json({ conversation });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Conversations API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
