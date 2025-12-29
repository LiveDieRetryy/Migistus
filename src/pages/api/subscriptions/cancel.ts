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

    const { cancelAtPeriodEnd = true } = req.body;

    // Get user's subscription
    const subscription = await paymentStorage.getUserSubscription(session.userId);

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription
    const updatedSub = await paymentStorage.cancelSubscription(
      subscription.id,
      cancelAtPeriodEnd
    );

    return res.status(200).json({ 
      success: true, 
      subscription: updatedSub,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription canceled immediately'
    });

  } catch (error) {
    console.error('Subscription cancel API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
