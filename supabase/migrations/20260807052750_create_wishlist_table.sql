/*
# Create wishlist table

1. New Tables
  - `wishlist`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users, defaults to the authenticated user)
    - `product_id` (uuid, references products, not null)
    - `created_at` (timestamptz, defaults to now())
  - Unique constraint on (user_id, product_id) so each user can save a product only once.

2. Security
  - Enable RLS on `wishlist`.
  - Owner-scoped CRUD: each authenticated user can only access rows they own.
  - Policies: select/insert/update/delete, all scoped to auth.uid() = user_id.

3. Indexes
  - Index on user_id for fast lookup of a user's wishlist.
  - Unique index on (user_id, product_id) to enforce one-save-per-product.
*/

CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product
  ON wishlist(user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
  ON wishlist(user_id);

DROP POLICY IF EXISTS "select_own_wishlist" ON wishlist;
CREATE POLICY "select_own_wishlist" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON wishlist;
CREATE POLICY "insert_own_wishlist" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wishlist" ON wishlist;
CREATE POLICY "update_own_wishlist" ON wishlist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON wishlist;
CREATE POLICY "delete_own_wishlist" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
