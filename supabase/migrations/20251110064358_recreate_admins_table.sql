/*
  # Recreate Admins Table

  1. Drop existing admins table if it exists
  
  2. Create new admins table
    - `id` (uuid, primary key - matches Supabase Auth user ID)
    - `email` (text, optional for reference)
    - `created_at` (timestamptz, default NOW())

  3. Security
    - Enable RLS on `admins` table
    - Add policy for authenticated admins to read their own data

  4. Initial Admin User
    - Note: You must manually insert an admin after creating a Supabase Auth user
*/

-- Drop existing admins table and all related objects
DROP TABLE IF EXISTS admins CASCADE;

-- Create new admins table with id matching auth.users
CREATE TABLE admins (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their own data
CREATE POLICY "Admins can read own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Note: To add an admin user, first create a user via Supabase Auth, then:
-- INSERT INTO admins (id, email) VALUES ('auth-user-uuid', 'admin@example.com');