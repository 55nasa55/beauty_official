/*
  # Allow Public Read of Member Pricing

  1. Changes
    - Add SELECT policy to product_variants to allow public read access to member_price_cents
    - This enables the storefront to display member pricing information without authentication
  
  2. Security
    - RLS remains enabled
    - Only SELECT operations are allowed
    - No sensitive data is exposed (member pricing is intended for public display)
*/

CREATE POLICY "Allow public read of member pricing"
ON product_variants
FOR SELECT
USING (true);