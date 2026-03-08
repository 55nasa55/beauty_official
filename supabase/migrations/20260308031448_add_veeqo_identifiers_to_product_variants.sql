/*
  # Add Veeqo Identifiers to Product Variants

  1. Changes
    - Add `veeqo_product_id` column to `product_variants` table
    - Add `veeqo_sellable_id` column to `product_variants` table
  
  2. Purpose
    - Store Veeqo product ID for resilient matching
    - Store Veeqo sellable ID for order line items
    - Enable pre-synced sellable system at the variant level
    - Align with SKU architecture (SKUs exist on variants, not products)
  
  3. Notes
    - Both columns are nullable (optional)
    - Uses BIGINT type to match Veeqo's ID format
    - No existing columns are modified
    - No data loss occurs
*/

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS veeqo_product_id BIGINT;

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS veeqo_sellable_id BIGINT;