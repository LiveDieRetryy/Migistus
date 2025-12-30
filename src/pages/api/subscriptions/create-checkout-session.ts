import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

// Price IDs from Stripe Dashboard
// You'll need to replace these with your actual price IDs from Stripe
const PRICE_IDS = {
  guild: process.env.STRIPE_GUILD_PRICE_ID || '', // Guild Member - $9.99/month
  elite: process.env.STRIPE_ELITE_PRICE_ID || '', // MIGISTUS Elite - $19.99/month
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
    const { userId, tier, customerId } = req.body;

    if (!userId || !tier || !customerId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'tier', 'customerId']
      });
    }

    // Validate tier
    if (tier !== 'guild' && tier !== 'elite') {
      return res.status(400).json({ 
        error: 'Invalid tier',
        validTiers: ['guild', 'elite']
      });
    }

    // Get price ID for selected tier
    const priceId = PRICE_IDS[tier as 'guild' | 'elite'];
    
    if (!priceId) {
      return res.status(500).json({ 
        error: 'Price ID not configured',
        message: `Please set STRIPE_${tier.toUpperCase()}_PRICE_ID in environment variables`
      });
    }

    // Verify user exists
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/account/subscription?canceled=true`,
      metadata: {
        userId: userId.toString(),
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          tier: tier,
        },
      },
      // Enable customer portal for subscription management
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log(`✅ Created checkout session ${session.id} for user ${userId} - ${tier} tier`);

    res.status(200).json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
