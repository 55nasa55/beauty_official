/*
  # Add Queue Scheduling and Locking to Order Sync Jobs

  1. Changes
    - Add `next_run_at` (timestamptz, default now()) - schedules when job should be processed
    - Add `processing_started_at` (timestamptz, nullable) - tracks when job processing began for concurrency safety
  
  2. Purpose
    - Enable smart job scheduling to reduce unnecessary API calls
    - Prevent multiple workers from processing the same job concurrently
    - Support exponential backoff for shipment status checks
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_sync_jobs' AND column_name = 'next_run_at'
  ) THEN
    ALTER TABLE order_sync_jobs ADD COLUMN next_run_at timestamptz DEFAULT now() NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_sync_jobs' AND column_name = 'processing_started_at'
  ) THEN
    ALTER TABLE order_sync_jobs ADD COLUMN processing_started_at timestamptz;
  END IF;
END $$;

-- Add index for efficient next_run_at queries
CREATE INDEX IF NOT EXISTS idx_order_sync_jobs_next_run_at 
  ON order_sync_jobs(next_run_at) 
  WHERE status = 'pending';
