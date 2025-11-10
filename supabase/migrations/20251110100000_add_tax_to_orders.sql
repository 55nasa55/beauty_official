/*
  # Add Tax Field to Orders Table

  1. Changes
    - Add `tax_amount` column (decimal) to orders table
    - Add `tax_details` column (jsonb) to store detailed tax information

  2. Notes
    - Tax amount stores the total tax collected
    - Tax details stores breakdown by jurisdiction if needed
*/

-- Add tax_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_amount decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add tax_details column for detailed tax information
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax_details'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_details jsonb;
  END IF;
END $$;
