/*
  # Create Membership System

  1. New Tables
    - `membership_plans`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Plan name (e.g., "Annual Membership")
      - `description` (text, nullable) - Plan description
      - `stripe_price_id` (text, unique, not null) - Stripe Price ID
      - `billing_interval` (text, not null) - Billing interval (year, month)
      - `amount_cents` (integer, nullable) - Price in cents for display
      - `is_active` (boolean, default true) - Whether plan is available
      - `sort_order` (integer, default 0) - Display order
      - `created_at` (timestamptz, default now())
    
    - `memberships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, unique, references auth.users) - User who owns membership
      - `plan_id` (uuid, references membership_plans) - Current plan
      - `status` (text, default 'inactive') - Subscription status
      - `stripe_customer_id` (text) - Stripe customer ID
      - `stripe_subscription_id` (text) - Stripe subscription ID
      - `current_period_end` (timestamptz) - When current period ends
      - `cancel_at_period_end` (boolean, default false) - Whether subscription cancels at period end
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Products Table Changes
    - Add `member_price_cents` (integer, nullable) - Member-only pricing

  3. Security
    - Enable RLS on both tables
    - Public can read active membership plans
    - Users can read only their own membership
    - Only service role can insert/update memberships

  4. Initial Data
    - Insert Annual Membership plan with Stripe Price ID
*/

-- Create membership_plans table
CREATE TABLE IF NOT EXISTS membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  stripe_price_id text UNIQUE NOT NULL,
  billing_interval text NOT NULL,
  amount_cents integer,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES membership_plans(id),
  status text DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add member_price_cents to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'member_price_cents'
  ) THEN
    ALTER TABLE products ADD COLUMN member_price_cents integer;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_plans
CREATE POLICY "Anyone can view active membership plans"
  ON membership_plans
  FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for memberships
CREATE POLICY "Users can view own membership"
  ON memberships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert Annual Membership plan
INSERT INTO membership_plans (
  name,
  description,
  stripe_price_id,
  billing_interval,
  is_active,
  sort_order
) VALUES (
  'Annual Membership',
  'Exclusive member pricing across the store',
  'price_1SnxTELWXRUBkfBOlfViyMO5',
  'year',
  true,
  0
) ON CONFLICT (stripe_price_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_stripe_price_id ON membership_plans(stripe_price_id);
