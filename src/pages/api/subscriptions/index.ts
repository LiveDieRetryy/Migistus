import { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '@/lib/session';
import { paymentStorage } from '@/utils/paymentStorage';

// Subscription tiers and pricing
const SUBSCRIPTION_PLANS = {
  initiate: { name: 'Guild Initiate', price: 0, features: ['Access to guild drops', '1x voting power', 'Community forums', 'Basic guild support'] },
  guild: { name: 'Guild Member', price: 9.99, features: ['All Initiate benefits', '2x voting power', 'Priority guild support', '5% additional discount', 'Early drop access'] },
  migistus: { name: 'MIGISTUS Elite', price: 19.99, features: ['All Member benefits', '4x voting power', 'VIP guild support', '10% additional discount', 'Exclusive elite drops', 'Personal guild concierge'] }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get user's current subscription
      const subscription = await paymentStorage.getUserSubscription(session.userId);

      if (!subscription) {
        return res.status(200).json({ 
          subscription: null,
          currentPlan: 'initiate',
          plans: SUBSCRIPTION_PLANS
        });
      }

      return res.status(200).json({ 
        subscription,
        currentPlan: subscription.planId,
        plans: SUBSCRIPTION_PLANS
      });

    } else if (req.method === 'POST') {
      // Create or upgrade subscription
      const { planId, paymentMethodId } = req.body;

      // Validation
      if (!planId || !SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS]) {
        return res.status(400).json({ error: 'Invalid subscription plan' });
      }

      // Free tier doesn't need payment
      if (planId !== 'initiate' && !paymentMethodId) {
        return res.status(400).json({ error: 'Payment method required for paid plans' });
      }

      // Check for existing subscription
      const existingSub = await paymentStorage.getUserSubscription(session.userId);

      if (existingSub) {
        // Upgrade/downgrade existing subscription
        const now = new Date();
        const periodEnd = new Date(now.setMonth(now.getMonth() + 1));

        await paymentStorage.updateSubscription(existingSub.id, {
          planId,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: periodEnd.toISOString(),
          cancelAtPeriodEnd: false
        });

        // Create transaction for payment
        if (planId !== 'initiate') {
          const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
          await paymentStorage.createTransaction({
            userId: session.userId,
            type: 'subscription',
            amount: plan.price,
            currency: 'USD',
            status: 'completed',
            paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
            description: `${plan.name} subscription - Monthly`
          });
        }

        return res.status(200).json({ 
          success: true, 
          subscription: await paymentStorage.getUserSubscription(session.userId),
          message: 'Subscription updated successfully'
        });

      } else {
        // Create new subscription
        const now = new Date();
        const periodStart = new Date();
        const periodEnd = new Date(now.setMonth(now.getMonth() + 1));

        const subscription = await paymentStorage.createSubscription({
          userId: session.userId,
          planId,
          status: planId === 'initiate' ? 'active' : 'trialing',
          currentPeriodStart: periodStart.toISOString(),
          currentPeriodEnd: periodEnd.toISOString()
        });

        // Create transaction for paid plans
        if (planId !== 'initiate') {
          const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
          await paymentStorage.createTransaction({
            userId: session.userId,
            type: 'subscription',
            amount: plan.price,
            currency: 'USD',
            status: 'completed',
            paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
            description: `${plan.name} subscription - Monthly`
          });
        }

        return res.status(201).json({ 
          success: true, 
          subscription,
          message: 'Subscription created successfully'
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

  } catch (error) {
    console.error('Subscriptions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
