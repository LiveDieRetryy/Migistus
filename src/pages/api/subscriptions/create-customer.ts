import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { db } from '@/lib/db';
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

// File-based user lookup for development
const getUserFromFile = (userId: number) => {
  try {
    const usersPath = path.join(process.cwd(), 'public', 'data', 'users.json');
    const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    return data.users.find((u: any) => u.id === userId) || null;
  } catch (error) {
    console.error('Error reading users file:', error);
    return null;
  }
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
    const { userId, email, username } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'email']
      });
    }

    // Get user from appropriate storage
    const user = isProduction() 
      ? await db.getUserById(userId)
      : getUserFromFile(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        details: `User with ID ${userId} does not exist in ${isProduction() ? 'database' : 'file storage'}`
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
    if (isProduction()) {
      await db.updateUser(userId, {
        stripeCustomerId: customer.id
      });
    } else {
      updateUserInFile(userId, {
        stripeCustomerId: customer.id
      });
    }

    console.log(`✅ Created Stripe customer ${customer.id} for user ${userId} (${isProduction() ? 'database' : 'file'})`);

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
