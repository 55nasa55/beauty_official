/*
  # Update Admins Table

  1. Changes
    - Add `user_id` column (uuid, unique, not null)
    - Add `updated_at` column (timestamptz)
    - Update email column to NOT NULL
    - Enable RLS if not already enabled
    - Add policies for admin access
    - Add trigger for auto-updating updated_at

  2. Indexes
    - Add unique index on `user_id`
    - Add index on `email`
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE admins ADD COLUMN user_id uuid UNIQUE;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admins' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admins ADD COLUMN updated_at timestamptz DEFAULT NOW() NOT NULL;
  END IF;
END $$;

-- Update email to NOT NULL if needed
DO $$
BEGIN
  ALTER TABLE admins ALTER COLUMN email SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read own data" ON admins;

-- Policy: Admins can read their own data
CREATE POLICY "Admins can read own data"
  ON admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();