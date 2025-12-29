import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';

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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID format' });
    }

    if (req.method === 'GET') {
      // GET /api/notifications/[id] - Get single notification
      const notifications = await notificationStorage.getNotifications(userId);
      const notification = notifications.find((n: any) => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.status(200).json(notification);
    }

    if (req.method === 'PUT') {
      // PUT /api/notifications/[id] - Mark as read
      const notifications = await notificationStorage.getNotifications(userId);
      const notification = notifications.find((n: any) => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership
      if (notification.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await notificationStorage.markAsRead(notificationId);
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    }

    if (req.method === 'DELETE') {
      // DELETE /api/notifications/[id] - Delete notification
      const notifications = await notificationStorage.getNotifications(userId);
      const notification = notifications.find((n: any) => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Verify ownership
      if (notification.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await notificationStorage.deleteNotification(notificationId);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
