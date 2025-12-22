/*
  # Fix Admin Email Casing and RLS

  1. Changes
    - Normalize all admin emails to lowercase
    - Update RLS policies to allow email-based lookups
    - Block anonymous access to admins table

  2. Security
    - Authenticated users can only read their own admin row by email
    - Anonymous users cannot access admins table
    - Email comparison is case-insensitive

  3. Details
    - The requireAdmin function queries admins by email
    - Previous RLS policy only allowed auth.uid() = id checks
    - New policy allows email-based queries to work with RLS
*/

-- Normalize all admin emails to lowercase
UPDATE public.admins SET email = LOWER(email);

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read own data" ON public.admins;
DROP POLICY IF EXISTS "Admins can read own row" ON public.admins;
DROP POLICY IF EXISTS "No anon access to admins" ON public.admins;

-- Ensure RLS is enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read their own admin row by email
CREATE POLICY "Admins can read own row"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (LOWER(email) = LOWER(auth.email()));

-- Policy: Block all anonymous access
CREATE POLICY "No anon access to admins"
  ON public.admins
  FOR SELECT
  TO anon
  USING (false);
