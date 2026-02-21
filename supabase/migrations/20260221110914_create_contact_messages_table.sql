/*
  # Create contact messages table

  1. New Tables
    - `contact_messages`
      - `id` (uuid, primary key)
      - `name` (text, required) - Name of the person submitting the form
      - `email` (text, required) - Contact email address
      - `subject` (text, optional) - Subject of the message
      - `message` (text, required) - The message content
      - `created_at` (timestamptz) - When the message was submitted
      - `read` (boolean) - Whether an admin has read the message
  
  2. Security
    - Enable RLS on `contact_messages` table
    - Allow anyone to insert messages (public contact form)
    - Only admins can view all messages
  
  3. Indexes
    - Index on created_at for sorting
    - Index on read status for filtering
*/

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact messages (public form)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Admins can view all contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE LOWER(admins.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Only admins can update read status
CREATE POLICY "Admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE LOWER(admins.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE LOWER(admins.email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
