/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - guest checkout support)
      - `stripe_session_id` (text, unique)
      - `stripe_payment_intent` (text)
      - `status` (text, default 'pending')
      - `total_amount` (decimal)
      - `currency` (text, default 'usd')
      - `shipping_address` (jsonb)
      - `billing_address` (jsonb)
      - `items` (jsonb array)
      - `refund_date` (timestamptz, nullable)
      - `created_at` (timestamptz, default NOW())
      - `updated_at` (timestamptz, default NOW())

  2. Security
    - Enable RLS on `orders` table
    - Add policy for authenticated users to read their own orders
    - Add policy for service role to insert/update orders (for webhooks)

  3. Indexes
    - Add index on `user_id` for fast user order lookups
    - Add unique index on `stripe_session_id`
    - Add index on `status` for filtering
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent text,
  status text DEFAULT 'pending' NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd' NOT NULL,
  shipping_address jsonb,
  billing_address jsonb,
  items jsonb NOT NULL,
  refund_date timestamptz,
  created_at timestamptz DEFAULT NOW() NOT NULL,
  updated_at timestamptz DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own orders
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow service role to insert orders (for webhook)
CREATE POLICY "Service role can insert orders"
  ON orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Allow service role to update orders (for webhook)
CREATE POLICY "Service role can update orders"
  ON orders
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();