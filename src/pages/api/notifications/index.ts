import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';
import { emitNotification } from '@/utils/socketEmitter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authenticate user
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = session.userId;

    if (req.method === 'GET') {
      // GET /api/notifications - List user's notifications
      const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;
      
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      if (isNaN(limitNum) || isNaN(offsetNum)) {
        return res.status(400).json({ error: 'Invalid pagination parameters' });
      }
      
      if (limitNum > 100) {
        return res.status(400).json({ error: 'Limit cannot exceed 100' });
      }

      let notifications;
      if (unreadOnly === 'true') {
        notifications = await notificationStorage.getUnreadNotifications(userId);
      } else {
        notifications = await notificationStorage.getNotifications(
          userId,
          limitNum,
          offsetNum
        );
      }

      return res.status(200).json({
        notifications,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasMore: notifications.length === limitNum
        }
      });
    }

    if (req.method === 'POST') {
      // POST /api/notifications - Create notification (admin or system only)
      const { userId, type, title, message, data } = req.body;

      // Validate required fields
      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          error: 'Missing required fields: userId, type, title, message'
        });
      }

      // Validate notification type
      const validTypes = [
        'product_launch',
        'product_vote',
        'product_comment',
        'follower',
        'message',
        'system',
        'moderation'
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Only allow users to create notifications for themselves, or admins to create for anyone
      if (userId !== session.userId) {
        return res.status(403).json({
          error: 'Forbidden: Cannot create notifications for other users'
        });
      }

      const notification = await notificationStorage.createNotification({
        userId,
        type,
        title,
        message,
        metadata: data
      });

      // Emit real-time notification via Socket.IO
      await emitNotification(userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.metadata
      });

      return res.status(201).json(notification);
    }

    if (req.method === 'DELETE') {
      // DELETE /api/notifications - Delete all notifications for user
      await notificationStorage.deleteAllNotifications(userId);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
