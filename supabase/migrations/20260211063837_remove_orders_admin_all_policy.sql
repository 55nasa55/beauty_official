/*
  # Remove Broken RLS Policy from Orders Table

  1. Changes
    - Drop the `orders_admin_all` policy from orders table
    - This policy was causing RLS errors during order lookups
    - All other policies remain unchanged

  2. Remaining Active Policies
    - orders_select_own (SELECT, authenticated users can read own orders)
    - Users can read own orders (SELECT, authenticated users can read own orders)
    - Service role has full access to orders (ALL, service_role)
    - Service role can update orders (UPDATE, service_role)
    - Service role can insert orders (INSERT, service_role)
    - orders_customer_read_own (SELECT, public can read own orders)
    - orders_public_insert (INSERT, public can insert pending orders)
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "orders_admin_all" ON orders;
