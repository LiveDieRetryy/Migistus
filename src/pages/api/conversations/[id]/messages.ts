// src/pages/api/conversations/[id]/messages.ts
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
        // Get conversation messages
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const beforeMessageId = req.query.beforeMessageId 
          ? parseInt(req.query.beforeMessageId as string) 
          : undefined;
        const search = req.query.search as string;

        if (limit < 1 || limit > 100) {
          return res.status(400).json({ error: 'Limit must be between 1 and 100' });
        }

        let messages;
        if (search) {
          messages = await chatStorage.searchMessages(conversationId, search, limit);
        } else {
          messages = await chatStorage.getConversationMessages(
            conversationId,
            limit,
            offset,
            beforeMessageId
          );
        }

        // Get attachments and reactions for each message
        const messagesWithDetails = await Promise.all(
          messages.map(async (message: any) => {
            const attachments = await chatStorage.getMessageAttachments(message.id);
            const reactions = await chatStorage.getReactionCounts(message.id);
            const readStatus = await chatStorage.getMessageReadStatus(message.id);
            
            return {
              ...message,
              attachments,
              reactions,
              read_by: readStatus.length
            };
          })
        );

        return res.status(200).json({ messages: messagesWithDetails });
      }

      case 'POST': {
        // Send message
        const { content, messageType, replyToId, metadata } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          return res.status(400).json({ error: 'Content is required' });
        }

        if (content.length > 10000) {
          return res.status(400).json({ error: 'Content must be less than 10000 characters' });
        }

        const validMessageTypes = ['text', 'image', 'file', 'system'];
        const type = messageType && validMessageTypes.includes(messageType) ? messageType : 'text';

        let parsedReplyToId: number | undefined;
        if (replyToId) {
          parsedReplyToId = parseInt(replyToId as string);
          if (isNaN(parsedReplyToId)) {
            return res.status(400).json({ error: 'Invalid reply-to message ID' });
          }

          // Verify reply-to message exists in this conversation
          const replyToMessage = await chatStorage.getMessage(parsedReplyToId);
          if (!replyToMessage || replyToMessage.conversation_id !== conversationId) {
            return res.status(400).json({ error: 'Reply-to message not found in this conversation' });
          }
        }

        const message = await chatStorage.createMessage({
          conversationId,
          senderId: session.userId,
          content: content.trim(),
          messageType: type,
          replyToId: parsedReplyToId,
          metadata: metadata || null
        });

        // Mark message as read for sender
        await chatStorage.markMessageAsRead({
          messageId: message.id,
          userId: session.userId
        });

        return res.status(201).json({ message });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
