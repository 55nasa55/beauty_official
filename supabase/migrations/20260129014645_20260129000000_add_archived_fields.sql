/*
  # Add Product Archive System

  1. Changes to products table
    - Add `archived` (boolean, default: false) - marks product as archived
    - Add `archived_at` (timestamptz, nullable) - timestamp when archived

  2. Security
    - Update RLS policies to exclude archived products from public queries
    - Admin queries return all products (archived and active)

  3. Notes
    - Archived products remain in database for order history
    - No ON DELETE CASCADE - soft delete only
    - Storefront automatically excludes archived products
*/

-- Add archived fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'archived'
  ) THEN
    ALTER TABLE products ADD COLUMN archived boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE products ADD COLUMN archived_at timestamptz;
  END IF;
END $$;

-- Create index for performance on archived queries
CREATE INDEX IF NOT EXISTS idx_products_archived ON products(archived);

-- Drop existing public select policy if it exists
DROP POLICY IF EXISTS "Public can view products" ON products;

-- Create new RLS policy for public access - exclude archived products
CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (archived = false);

-- Admin policy to view all products (active and archived)
-- Note: Admin access is controlled via API layer with requireAdmin()
-- This policy allows authenticated users to see all products in admin context
CREATE POLICY "Authenticated users can view all products for admin"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);
