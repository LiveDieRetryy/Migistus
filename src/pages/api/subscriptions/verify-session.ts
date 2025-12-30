import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { getSessionToken } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

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

    if (isProduction()) {
      // Production: Update database
      await db.updateUser(userId, updates);
      
      // Also update the session in database to reflect new tier immediately
      try {
        const sessionToken = getSessionToken(req);
        if (sessionToken) {
          await db.updateSessionTier(sessionToken, userTier);
          console.log(`✅ Updated session tier in database for user ${userId}`);
        }
      } catch (error) {
        console.error('Error updating session in database:', error);
      }
    } else {
      // Development: Update file
      updateUserInFile(userId, updates);
      
      // Also update the session file in development
      try {
        const sessionsPath = path.join(process.cwd(), 'public', 'data', 'sessions.json');
        const sessionFileData = fs.readFileSync(sessionsPath, 'utf8');
        const sessions = JSON.parse(sessionFileData);
        
        // Update all sessions for this user (sessions is an object with token keys)
        for (const token in sessions) {
          if (sessions[token] && sessions[token].userId === userId) {
            sessions[token].tier = userTier;
          }
        }
        
        fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
        console.log(`✅ Updated session for user ${userId} to ${userTier} tier`);
      } catch (error) {
        console.error('Error updating session file:', error);
      }
    }

    console.log(`✅ Updated user ${userId} to ${userTier} tier (${isProduction() ? 'database' : 'file'})`);

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
