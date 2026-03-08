/*
  # Add Veeqo Identifiers to Products

  1. Changes
    - Add `veeqo_product_id` column to `products` table
    - Add `veeqo_sellable_id` column to `products` table
  
  2. Purpose
    - Store Veeqo product ID for resilient matching even if SKUs change
    - Store Veeqo sellable ID for order line items
    - Enable pre-synced sellable system instead of dynamic creation
  
  3. Notes
    - Both columns are nullable (optional)
    - Uses BIGINT type to match Veeqo's ID format
    - No existing columns are modified
    - No data loss occurs
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS veeqo_product_id BIGINT;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS veeqo_sellable_id BIGINT;