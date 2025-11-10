/*
  # Add Customer Information to Orders Table

  1. Changes
    - Add `customer_email` column (text) to orders table
    - Add `customer_name` column (text) to orders table

  2. Notes
    - Customer email stores the email from Stripe checkout
    - Customer name stores the name from Stripe checkout
    - These fields help identify the customer even for guest checkouts
*/

-- Add customer_email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_email text;
  END IF;
END $$;

-- Add customer_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_name text;
  END IF;
END $$;
