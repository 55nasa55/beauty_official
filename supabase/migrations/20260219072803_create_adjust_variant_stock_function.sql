/*
  # Create atomic inventory adjustment function

  1. New Function
    - `adjust_variant_stock(p_variant_id, p_adjustment)`
      - Atomically updates stock_quantity by adding the adjustment amount
      - Prevents stock from going below 0
      - Returns the new stock quantity
      - Raises exception if adjustment would result in negative stock

  2. Security
    - Function is accessible to authenticated users (admins will call via RPC)
    - The actual stock update is atomic at the database level

  3. Notes
    - This ensures race-condition-safe inventory updates
    - No possibility of negative stock
    - Single transaction for consistency
*/

CREATE OR REPLACE FUNCTION adjust_variant_stock(
  p_variant_id uuid,
  p_adjustment integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock integer;
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_adjustment
  WHERE id = p_variant_id
    AND stock_quantity + p_adjustment >= 0
  RETURNING stock_quantity INTO v_new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid stock adjustment: would result in negative stock or variant not found';
  END IF;

  RETURN v_new_stock;
END;
$$;
