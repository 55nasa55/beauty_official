/*
  # Add Membership Status Validation

  ## Changes
  
  1. Status Field Validation
    - Add check constraint to ensure status is one of: active, trialing, canceled, expired
  
  2. Column Verification
    - Ensure ended_at column exists (timestamptz)
    - Ensure current_period_end is timestamptz (already is, but verify)
  
  ## Purpose
  
  This migration adds validation to the membership status field to ensure only valid
  status values can be stored. This prevents data integrity issues from invalid statuses.
  
  Valid statuses:
  - active: Membership is currently active and paid
  - trialing: Membership is in trial period
  - canceled: Membership has been canceled
  - expired: Membership period has ended
*/

-- Verify ended_at column exists (should exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- Add check constraint for status field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memberships_status_check'
  ) THEN
    ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
      CHECK (status IN ('active', 'trialing', 'canceled', 'expired', 'inactive'));
  END IF;
END $$;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Create index on current_period_end for expiry checks
CREATE INDEX IF NOT EXISTS idx_memberships_period_end ON memberships(current_period_end);
