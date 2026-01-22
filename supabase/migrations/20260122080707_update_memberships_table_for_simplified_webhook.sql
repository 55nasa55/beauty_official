/*
  # Update Memberships Table for Simplified Webhook

  ## Changes
  
  1. Add New Columns
    - `stripe_price_id` (text) - Store price ID directly for reference
    - `ended_at` (timestamptz) - Track when membership ended
  
  2. Add Unique Constraint
    - Add unique constraint on `stripe_subscription_id` for idempotent upserts
  
  3. Create Index
    - Add index on `stripe_subscription_id` for faster lookups
  
  ## Purpose
  
  This migration supports the simplified webhook logic where:
  - checkout.session.completed creates memberships keyed by stripe_subscription_id
  - invoice.payment_succeeded updates billing periods
  - customer.subscription.deleted marks memberships as canceled with ended_at timestamp
  
  All operations are idempotent and use stripe_subscription_id as the conflict key.
*/

-- Add stripe_price_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE memberships ADD COLUMN stripe_price_id text;
  END IF;
END $$;

-- Add ended_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- Add unique constraint on stripe_subscription_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memberships_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Create index on stripe_subscription_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id ON memberships(stripe_subscription_id);
