import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // Get user's subscription
    const subscription = await paymentStorage.getUserSubscription(session.userId);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // If subscription was marked for cancellation, reactivate it
    if (subscription.cancelAtPeriodEnd) {
      await paymentStorage.updateSubscription(subscription.id, {
        cancelAtPeriodEnd: false
      });

      return res.status(200).json({ 
        success: true, 
        subscription: await paymentStorage.getUserSubscription(session.userId),
        message: 'Subscription reactivated successfully'
      });
    }

    // Otherwise, renew subscription for another period
    const currentEnd = new Date(subscription.currentPeriodEnd);
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);

    await paymentStorage.updateSubscription(subscription.id, {
      currentPeriodStart: currentEnd.toISOString(),
      currentPeriodEnd: newEnd.toISOString(),
      status: 'active'
    });

    return res.status(200).json({ 
      success: true, 
      subscription: await paymentStorage.getUserSubscription(session.userId),
      message: 'Subscription renewed successfully'
    });

  } catch (error) {
    console.error('Subscription renew API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
