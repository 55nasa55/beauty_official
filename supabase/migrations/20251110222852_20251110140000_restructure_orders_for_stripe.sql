/*
  # Restructure Orders for Stripe Checkout

  1. Changes to Orders Table
    - Add `order_number` (text, unique) - same as stripe_session_id for compatibility
    - Add `payment_status` (text) - current: paid, pending, failed, refunded
    - Add `shipping_status` (text) - Processing, Shipped, Delivered
    - Add `tracking_number` (text, nullable)
    - Add `customer_email` (text, nullable)
    - Add `customer_name` (text, nullable)
    - Add `tax_amount` (numeric) - for displaying tax separately
    - Add `tax_details` (jsonb, nullable) - for detailed tax breakdown

  2. New Table: Order Items
    - `id` (uuid, primary key)
    - `order_id` (uuid, foreign key to orders.id)
    - `product_id` (uuid, nullable reference to products)
    - `variant_id` (uuid, nullable reference to product_variants)
    - `product_name` (text) - snapshot at time of purchase
    - `variant_name` (text, nullable) - snapshot at time of purchase
    - `quantity` (integer)
    - `price` (numeric) - unit price at time of purchase
    - `created_at` (timestamptz)

  3. Security
    - Enable RLS on order_items table
    - Add policies for authenticated users to read their own order items
    - Keep existing orders table RLS
*/

-- Add new columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_status text DEFAULT 'Processing' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_amount numeric DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax_details'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_details jsonb;
  END IF;
END $$;

-- Backfill order_number from stripe_session_id for existing orders
UPDATE orders
SET order_number = stripe_session_id
WHERE order_number IS NULL;

-- Backfill payment_status from status for existing orders
UPDATE orders
SET payment_status = status
WHERE payment_status = 'pending';

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  product_name text NOT NULL,
  variant_name text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders(customer_email);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own order items
CREATE POLICY "Users can read own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Policy: Service role can do anything (for webhooks)
CREATE POLICY "Service role has full access to order items"
  ON order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update orders RLS to allow service role
CREATE POLICY "Service role has full access to orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
