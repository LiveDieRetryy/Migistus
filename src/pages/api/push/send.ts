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
    // Authenticate user (admin only)
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.tier !== 'Master') { // Check if admin
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const {
      userId,
      title,
      body,
      icon,
      data,
      broadcast = false
    } = req.body;

    // Validate required fields for non-broadcast
    if (!broadcast && !userId) {
      return res.status(400).json({
        error: 'userId is required unless broadcast is true'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: title, body'
      });
    }

    const payload = {
      title,
      body,
      icon: icon || '/icons/notification.png',
      data: data || {}
    };

    let subscriptions;
    if (broadcast) {
      // Send to all active subscriptions
      subscriptions = await notificationStorage.getAllActivePushSubscriptions();
    } else {
      // Send to specific user
      subscriptions = await notificationStorage.getUserPushSubscriptions(userId);
    }

    if (subscriptions.length === 0) {
      return res.status(404).json({
        error: 'No active push subscriptions found',
        message: broadcast 
          ? 'No users are subscribed to push notifications'
          : 'User has no active push subscriptions'
      });
    }

    // TODO: Implement actual push notification sending with web-push library
    // For now, return success with subscription count
    // In production, you would:
    // 1. Import web-push library
    // 2. Configure VAPID keys
    // 3. Send notifications to each subscription
    // 4. Handle failures and deactivate invalid subscriptions

    return res.status(200).json({
      success: true,
      message: `Push notification queued for ${subscriptions.length} subscription(s)`,
      subscriptionCount: subscriptions.length,
      payload,
      note: 'Actual push sending requires web-push library configuration with VAPID keys'
    });
  } catch (error) {
    console.error('Push send API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
