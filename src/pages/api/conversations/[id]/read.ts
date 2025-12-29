// src/pages/api/conversations/[id]/read.ts
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
      case 'POST': {
        // Mark all messages in conversation as read
        const markedCount = await chatStorage.markConversationAsRead(conversationId, session.userId);
        return res.status(200).json({ 
          message: 'Conversation marked as read',
          messagesMarked: markedCount
        });
      }

      default:
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Conversation read API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
