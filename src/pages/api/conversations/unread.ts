// src/pages/api/conversations/unread.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { chatStorage } from '@/utils/chatStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET': {
        // Get total unread message count across all conversations
        const totalUnread = await chatStorage.getUnreadMessageCount(session.userId);
        
        return res.status(200).json({ 
          unreadCount: totalUnread
        });
      }

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('Unread count API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
