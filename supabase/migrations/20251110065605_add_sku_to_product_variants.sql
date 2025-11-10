/*
  # Add SKU Column to Product Variants

  1. Changes
    - Add `sku` column (text, unique) to product_variants table
    - Add index on SKU for fast lookups
*/

-- Add SKU column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'sku'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN sku text UNIQUE;
  END IF;
END $$;

-- Add index on SKU for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);