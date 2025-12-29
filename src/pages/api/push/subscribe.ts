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

    const { endpoint, keys, userAgent } = req.body;

    // Validate required fields
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        error: 'Missing required fields: endpoint, keys.p256dh, keys.auth'
      });
    }

    // Validate endpoint format
    if (!endpoint.startsWith('https://')) {
      return res.status(400).json({
        error: 'Invalid endpoint: must be an HTTPS URL'
      });
    }

    // Save push subscription
    const subscription = await notificationStorage.savePushSubscription({
      userId: session.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || req.headers['user-agent'] || ''
    });

    return res.status(201).json({
      success: true,
      subscriptionId: subscription.id,
      message: 'Push subscription saved successfully'
    });
  } catch (error) {
    console.error('Push subscribe API error:', error);
    
    // Check for duplicate endpoint error
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({
        error: 'Subscription already exists',
        message: 'This device is already subscribed to push notifications'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
