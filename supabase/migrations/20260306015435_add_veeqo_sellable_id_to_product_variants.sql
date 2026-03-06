/*
  # Add Veeqo sellable ID to product variants

  1. Changes
    - Add `veeqo_sellable_id` column to `product_variants` table
    - This column stores the Veeqo sellable ID to prevent duplicate inventory items
    - Each variant will map to a single Veeqo sellable permanently

  2. Notes
    - Column is nullable to support existing variants
    - No unique constraint as multiple variants could theoretically share a sellable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'veeqo_sellable_id'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN veeqo_sellable_id BIGINT;
  END IF;
END $$;
