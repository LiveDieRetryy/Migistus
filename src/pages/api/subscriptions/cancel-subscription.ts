import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  guild: process.env.STRIPE_GUILD_PRICE_ID || '',
  elite: process.env.STRIPE_ELITE_PRICE_ID || '',
};

// Check if running in production
const isProduction = () => {
  return process.env.NEXT_PUBLIC_USE_DATABASE === 'true' || 
         process.env.NODE_ENV === 'production';
};

// Update user in file for development
const updateUserInFile = (userId: number, updates: any) => {
  try {
    const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');
    const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const userIndex = data.users.findIndex((u: any) => u.id === userId);
    
    if (userIndex !== -1) {
      data.users[userIndex] = { ...data.users[userIndex], ...updates };
      fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
      console.log(`✅ Updated user ${userId} in file:`, updates);
    }
  } catch (error) {
    console.error('Error updating users file:', error);
  }
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
    
    let subscription;
    
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
      console.log('📊 Retrieved subscription:', {
        current_period_end: currentSubscription.current_period_end,
        status: currentSubscription.status
      });
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
      
      console.log(`✅ Subscription ${subscriptionId} will switch to ${newTier} at period end:`,
        subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A'
      );
      console.log('📊 Updated subscription object:', {
        current_period_end: subscription.current_period_end,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      });
    } else {
      // Downgrading to free tier - cancel the subscription at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      console.log(`✅ Subscription ${subscriptionId} will cancel at period end:`,
        subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A'
      );
    }

    // Update subscription status to canceling and set pending tier to target tier
    // User keeps current tier benefits until period ends, but UI shows target tier as "current"
    const updates = {
      tier: newTier,
      stripeSubscriptionStatus: 'canceling',
      subscriptionCurrentPeriodEnd: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    };

    if (isProduction()) {
      await db.updateUser(userId, updates);
    } else {
      updateUserInFile(userId, updates);
      
      // Also update the session file in development
      try {
        const sessionsPath = path.join(process.cwd(), 'public', 'data', 'sessions.json');
        const sessionFileData = fs.readFileSync(sessionsPath, 'utf8');
        const sessions = JSON.parse(sessionFileData);
        
        // Update all sessions for this user
        for (const token in sessions) {
          if (sessions[token] && sessions[token].userId === userId) {
            sessions[token].tier = 'Initiate';
            sessions[token].stripeSubscriptionStatus = 'canceling';
          }
        }
        
        fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
        console.log(`✅ Updated session for user ${userId} to Initiate tier (canceling)`);
      } catch (error) {
        console.error('Error updating session file:', error);
      }
    }

    console.log(`✅ Updated user ${userId} to Initiate tier (${isProduction() ? 'database' : 'file'})`);

    res.status(200).json({ 
      success: true,
      cancelAt: subscription.cancel_at ?? subscription.current_period_end,
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
