/*
  # Add Member Pricing to Product Variants

  1. Changes
    - Add `member_price_cents` column to `product_variants` table
      - Type: integer (nullable)
      - Used to store member-exclusive pricing per variant
    
  2. Data Migration
    - Migrate existing product-level `member_price_cents` to all variants of those products
    - Products without variants retain their product-level member pricing as fallback
    
  3. Notes
    - Product-level `member_price_cents` is kept as fallback for products without variants
    - Variant-level pricing takes precedence over product-level when both exist
    - Member pricing is optional (nullable)
*/

-- Add member_price_cents column to product_variants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'member_price_cents'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN member_price_cents integer;
  END IF;
END $$;

-- Migrate existing product-level member_price_cents to all variants
UPDATE product_variants pv
SET member_price_cents = p.member_price_cents
FROM products p
WHERE pv.product_id = p.id
  AND p.member_price_cents IS NOT NULL
  AND pv.member_price_cents IS NULL;