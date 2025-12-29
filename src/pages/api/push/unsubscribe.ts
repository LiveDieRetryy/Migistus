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

    const { endpoint } = req.body;

    // Validate required fields
    if (!endpoint) {
      return res.status(400).json({
        error: 'Missing required field: endpoint'
      });
    }

    // Verify user owns this subscription
    const userSubscriptions = await notificationStorage.getUserPushSubscriptions(session.userId);
    const subscription = userSubscriptions.find((sub: any) => sub.endpoint === endpoint);

    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found or does not belong to user'
      });
    }

    // Remove subscription
    await notificationStorage.removePushSubscription(endpoint);

    return res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully'
    });
  } catch (error) {
    console.error('Push unsubscribe API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
