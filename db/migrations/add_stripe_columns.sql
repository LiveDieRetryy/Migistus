-- Migration: Add Stripe subscription columns to users table
-- Date: December 29, 2025
-- Purpose: Enable Stripe subscription management for membership upgrades

-- Add Stripe-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(stripe_subscription_status);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN (
    'stripe_customer_id', 
    'stripe_subscription_id', 
    'stripe_subscription_status',
    'subscription_current_period_end'
  )
ORDER BY column_name;
