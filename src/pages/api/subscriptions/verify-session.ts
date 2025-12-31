import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { getSessionToken } from '@/lib/session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userId = parseInt(session.metadata?.userId || '0');
    const tier = session.metadata?.tier; // 'guild' or 'elite'

    if (!userId || !tier) {
      return res.status(400).json({ error: 'Invalid session metadata' });
    }

    // Map tier to user tier
    const userTier = tier === 'elite' ? 'MIGISTUS' : tier === 'guild' ? 'Guild' : 'Initiate';

    // Get subscription ID
    const sessionSubscription = session.subscription as Stripe.Subscription;
    const subscriptionId = typeof sessionSubscription === 'string' ? sessionSubscription : sessionSubscription?.id;
    
    // Retrieve full subscription details directly from Stripe
    // This ensures we get current_period_end and other important fields
    let subscription: Stripe.Subscription | null = null;
    let currentPeriodEnd = null;
    
    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if ((subscription as any).current_period_end) {
        currentPeriodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();
      }
    }
    
    const subscriptionStatus = subscription?.status || 'active';

    // Update user's tier and subscription info
    const updates = {
      tier: userTier,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: subscriptionStatus,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
    };

    await db.updateUser(userId, updates);
    
    // Also update the session to reflect new tier immediately
    try {
      const sessionToken = getSessionToken(req);
      if (sessionToken) {
        await db.updateSessionTier(sessionToken, userTier);
        console.log(`✅ Updated session tier for user ${userId}`);
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }

    console.log(`✅ Updated user ${userId} to ${userTier} tier`);

    res.status(200).json({ 
      success: true,
      tier: userTier,
      subscriptionId,
      userId
    });

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ 
      error: 'Failed to verify session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
