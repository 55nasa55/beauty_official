/*
  # Add past_due Status to Memberships

  ## Changes
  
  1. Status Field Update
    - Drop existing check constraint
    - Add new check constraint with past_due status included
  
  ## Purpose
  
  This migration adds 'past_due' as a valid membership status to handle failed payments.
  
  Valid statuses:
  - active: Membership is currently active and paid
  - trialing: Membership is in trial period (deprecated, treated as active)
  - past_due: Payment failed but subscription still active
  - canceled: Membership has been canceled
  - expired: Membership period has ended (deprecated)
  - inactive: Initial state or temporary state
*/

-- Drop existing constraint
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_status_check;

-- Add new constraint with past_due status
ALTER TABLE memberships ADD CONSTRAINT memberships_status_check
  CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'inactive'));
