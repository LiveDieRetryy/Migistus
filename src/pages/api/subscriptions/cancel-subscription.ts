import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  guild: process.env.STRIPE_GUILD_PRICE_ID || '',
  elite: process.env.STRIPE_ELITE_PRICE_ID || '',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { subscriptionId, userId, targetTier } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ 
        error: 'Missing required field: subscriptionId'
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId'
      });
    }

    // Default to Initiate if no target tier specified
    const newTier = targetTier || 'Initiate';

    console.log(`🔄 Canceling subscription ${subscriptionId} for user ${userId}, downgrading to ${newTier}`);

    // Check if downgrading to a paid tier (Guild or Elite) or free tier (Initiate)
    const isPaidTierDowngrade = newTier === 'Guild' || newTier === 'MIGISTUS';
    
    let subscription: Stripe.Subscription;
    
    if (isPaidTierDowngrade) {
      // Downgrading to a paid tier - switch the subscription to the new price
      const targetPriceId = newTier === 'Guild' ? PRICE_IDS.guild : PRICE_IDS.elite;
      
      if (!targetPriceId) {
        return res.status(500).json({
          error: 'Price ID not configured',
          message: `Please set STRIPE_${newTier.toUpperCase()}_PRICE_ID in environment variables`
        });
      }
      
      // Get the current subscription to find the subscription item ID
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItemId = currentSubscription.items.data[0].id;
      
      // Update subscription to new price at the end of the billing period
      subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItemId,
          price: targetPriceId,
        }],
        proration_behavior: 'none', // No proration, changes at period end
        cancel_at_period_end: false, // Don't cancel, just switch price
      });
    } else {
      // Downgrading to free tier - cancel the subscription at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Update subscription status to canceling and set pending tier to target tier
    // User keeps current tier benefits until period ends, but UI shows target tier as "current"
    const updates = {
      tier: newTier,
      stripeSubscriptionStatus: 'canceling',
      subscriptionCurrentPeriodEnd: (subscription as any).current_period_end 
        ? new Date((subscription as any).current_period_end * 1000).toISOString()
        : null,
    };

    await db.updateUser(userId, updates);

    console.log(`✅ Updated user ${userId} to ${newTier} tier`);

    res.status(200).json({ 
      success: true,
      cancelAt: (subscription as any).cancel_at ?? (subscription as any).current_period_end,
      message: isPaidTierDowngrade 
        ? `Subscription will switch to ${newTier} at the end of the current billing period`
        : 'Subscription will be canceled at the end of the current billing period',
      isPaidDowngrade: isPaidTierDowngrade
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
