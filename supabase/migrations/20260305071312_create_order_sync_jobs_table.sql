/*
  # Create Order Sync Jobs Table

  1. New Tables
    - `order_sync_jobs`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `job_type` (text, e.g., 'push_to_veeqo')
      - `status` (text, default 'pending')
      - `attempts` (integer, default 0)
      - `error_message` (text, nullable)
      - `payload` (jsonb, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `processed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `order_sync_jobs` table
    - Add policy for service role to manage jobs
    - Add policy for admins to view jobs

  3. Indexes
    - Add index on `order_id` for lookups
    - Add index on `status` for processing queue
    - Add composite index on `status, created_at` for job queue processing
*/

CREATE TABLE IF NOT EXISTS order_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  job_type text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  error_message text,
  payload jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_order_sync_jobs_order_id ON order_sync_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_sync_jobs_status ON order_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_order_sync_jobs_status_created ON order_sync_jobs(status, created_at);

ALTER TABLE order_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sync jobs"
  ON order_sync_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view sync jobs"
  ON order_sync_jobs
  FOR SELECT
  TO authenticated
  USING (
    auth.email() IN (SELECT email FROM admins)
  );

CREATE TRIGGER update_order_sync_jobs_updated_at
  BEFORE UPDATE ON order_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
