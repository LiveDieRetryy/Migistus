// src/pages/api/conversations/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { chatStorage } from '@/utils/chatStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversationId = parseInt(req.query.id as string);
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    // Verify user is participant
    const isParticipant = await chatStorage.isParticipant(conversationId, session.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    switch (req.method) {
      case 'GET': {
        // Get conversation details
        const conversation = await chatStorage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        // Get participants
        const participants = await chatStorage.getConversationParticipants(conversationId);

        // Get unread count
        const unreadCount = await chatStorage.getUnreadMessageCount(session.userId, conversationId);

        return res.status(200).json({
          conversation: {
            ...conversation,
            participants,
            unread_count: unreadCount
          }
        });
      }

      case 'PUT': {
        // Update conversation
        const { name, isArchived } = req.body;

        // Only admins can change name, anyone can archive
        if (name !== undefined) {
          const participants = await chatStorage.getConversationParticipants(conversationId);
          const currentUser = participants.find((p: any) => p.user_id === session.userId);
          
          if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change conversation name' });
          }

          if (typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name must be a non-empty string' });
          }
        }

        if (isArchived !== undefined && typeof isArchived !== 'boolean') {
          return res.status(400).json({ error: 'isArchived must be a boolean' });
        }

        const updated = await chatStorage.updateConversation(conversationId, {
          name: name?.trim(),
          isArchived
        });

        return res.status(200).json({ conversation: updated });
      }

      case 'DELETE': {
        // Delete conversation (admin only)
        const participants = await chatStorage.getConversationParticipants(conversationId);
        const currentUser = participants.find((p: any) => p.user_id === session.userId);
        
        if (!currentUser || currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can delete conversations' });
        }

        await chatStorage.deleteConversation(conversationId);
        return res.status(200).json({ message: 'Conversation deleted successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Conversation API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
