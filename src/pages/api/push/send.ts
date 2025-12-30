import type { NextApiRequest, NextApiResponse } from 'next';
import { db, isProduction } from '@/lib/db';
import { notificationStorage } from '@/utils/notificationStorage';
import { getSessionFromRequest } from '@/lib/session';
import webpush from 'web-push';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

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

    if (session.tier !== 'Master' && session.tier !== 'King') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const {
      userId,
      title,
      body,
      icon,
      data,
      url,
      broadcast = false,
      tag
    } = req.body;

    // Validate required fields
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

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/logo.png',
      badge: '/badge.png',
      tag: tag || 'migistus-notification',
      data: { url: url || '/', ...data },
      requireInteraction: false
    });

    let subscriptions;
    let sentCount = 0;
    let failedCount = 0;

    if (isProduction()) {
      // Use database in production
      if (broadcast) {
        subscriptions = await db.getAllActivePushSubscriptions();
      } else {
        subscriptions = await db.getUserPushSubscriptions(userId);
      }

      if (subscriptions.length === 0) {
        return res.status(404).json({
          error: 'No active push subscriptions found',
          message: broadcast 
            ? 'No users are subscribed to push notifications'
            : 'User has no active push subscriptions'
        });
      }

      // Send push notifications
      const sendPromises = subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            payload
          );
          sentCount++;
        } catch (error: any) {
          console.error(`Failed to send to ${sub.endpoint}:`, error);
          failedCount++;

          // Deactivate subscription if it's invalid (410 Gone or 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.deactivatePushSubscription(sub.endpoint);
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } else {
      // Use file storage in development
      if (broadcast) {
        subscriptions = await notificationStorage.getAllActivePushSubscriptions();
      } else {
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

      // In development, just simulate sending
      sentCount = subscriptions.length;
      console.log(`[DEV] Would send push to ${sentCount} subscription(s):`, payload);
    }

    return res.status(200).json({
      success: true,
      message: `Push notification sent to ${sentCount} subscription(s)`,
      sentCount,
      failedCount,
      totalSubscriptions: subscriptions.length,
      payload: JSON.parse(payload)
    });
  } catch (error) {
    console.error('Push send API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
