/*
  # Add Admin Review RLS Policies

  1. New Policies
    - Allow admins to soft-delete reviews (update deleted_at)
    - Allow admins to delete product subratings

  2. Security
    - Both policies verify admin status via admins table
    - Policies are restrictive and only allow authenticated admins
*/

-- Drop policies if they exist, then recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "admin soft delete" ON reviews;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "admin delete subratings" ON product_subratings;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Allow admins to soft delete reviews
CREATE POLICY "admin soft delete"
ON reviews FOR UPDATE
TO authenticated
USING (
  EXISTS(SELECT 1 FROM admins WHERE admins.id = auth.uid())
)
WITH CHECK (true);

-- Allow admins to delete product subratings
CREATE POLICY "admin delete subratings"
ON product_subratings FOR DELETE
TO authenticated
USING (
  EXISTS(SELECT 1 FROM admins WHERE admins.id = auth.uid())
);