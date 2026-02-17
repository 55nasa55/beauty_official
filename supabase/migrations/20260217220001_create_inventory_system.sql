/*
  # Create Inventory System

  1. Changes to Existing Tables
    - `product_variants`
      - Add `stock_quantity` (integer, default 0) - Current stock level
      - Add `track_inventory` (boolean, default true) - Whether to track inventory for this variant
      - Add `low_stock_threshold` (integer, default 5) - Alert threshold for low stock

  2. New Tables
    - `inventory_adjustments`
      - `id` (uuid, primary key) - Unique identifier
      - `variant_id` (uuid, foreign key) - References product_variants
      - `change_amount` (integer) - Positive for additions, negative for reductions
      - `reason` (text) - Explanation for the adjustment
      - `created_by` (uuid, foreign key) - Admin user who made the change
      - `created_at` (timestamptz) - When the adjustment was made

  3. Security
    - Enable RLS on `inventory_adjustments` table
    - Admin-only access for inventory_adjustments (select, insert, update)
    - No public access to inventory adjustments

  4. Important Notes
    - Existing product_variants data is preserved
    - New columns have safe defaults
    - Inventory adjustments provide complete audit trail
    - Use negative change_amount for stock reductions
*/

-- Add inventory columns to product_variants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN stock_quantity integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN track_inventory boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 5;
  END IF;
END $$;

-- Create inventory_adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  change_amount integer NOT NULL,
  reason text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on inventory_adjustments
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view inventory adjustments" ON inventory_adjustments;
DROP POLICY IF EXISTS "Admins can create inventory adjustments" ON inventory_adjustments;
DROP POLICY IF EXISTS "Admins can update inventory adjustments" ON inventory_adjustments;

-- Admin can view all inventory adjustments
CREATE POLICY "Admins can view inventory adjustments"
  ON inventory_adjustments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can create inventory adjustments
CREATE POLICY "Admins can create inventory adjustments"
  ON inventory_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can update inventory adjustments (for corrections)
CREATE POLICY "Admins can update inventory adjustments"
  ON inventory_adjustments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Create index for faster lookups by variant
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant_id
  ON inventory_adjustments(variant_id);

-- Create index for faster lookups by date
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at
  ON inventory_adjustments(created_at DESC);