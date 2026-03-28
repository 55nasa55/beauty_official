/*
  # Add cancel_at field to memberships table

  1. Changes
    - Add `cancel_at` (timestamptz, nullable) - Scheduled cancellation timestamp from Stripe
  
  2. Purpose
    - Track when Stripe has scheduled a subscription to cancel
    - Enables proper handling of subscription reactivation (when cancel_at becomes null)
    - Complements existing cancel_at_period_end boolean field
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'cancel_at'
  ) THEN
    ALTER TABLE memberships ADD COLUMN cancel_at timestamptz;
  END IF;
END $$;
