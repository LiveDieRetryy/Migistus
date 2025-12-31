import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';

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
    const { userId, email, username } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'email']
      });
    }

    // Get user from database
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: `User with ID ${userId} does not exist`
      });
    }

    // If user already has a stripe_customer_id, retrieve and return it
    if (user.stripe_customer_id) {
      try {
        const existingCustomer = await stripe.customers.retrieve(user.stripe_customer_id);
        
        if (!existingCustomer.deleted) {
          return res.status(200).json({ 
            customerId: user.stripe_customer_id,
            existing: true
          });
        }
        // If customer was deleted, we'll create a new one
      } catch (error) {
        console.error('Failed to retrieve existing customer:', error);
        // Continue to create new customer
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: email,
      name: username || user.username,
      metadata: {
        userId: userId.toString(),
        username: username || user.username
      }
    });

    // Update user record with Stripe customer ID
    await db.updateUser(userId, {
      stripeCustomerId: customer.id
    });

    console.log(`✅ Created Stripe customer ${customer.id} for user ${userId}`);

    res.status(200).json({ 
      customerId: customer.id,
      existing: false
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ 
      error: 'Failed to create customer',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
