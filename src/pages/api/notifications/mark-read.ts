import type { NextApiRequest, NextApiResponse } from 'next';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = session.userId;

    const { notificationId, markAll } = req.body;

    if (markAll) {
      // Mark all notifications as read
      await notificationStorage.markAllAsRead(userId);
      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        error: 'Either notificationId or markAll must be provided'
      });
    }

    // Verify notification belongs to user
    const notifications = await notificationStorage.getNotifications(userId);
    const notification = notifications.find((n: any) => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

if (notification.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Mark single notification as read
    await notificationStorage.markAsRead(notificationId);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark read API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
