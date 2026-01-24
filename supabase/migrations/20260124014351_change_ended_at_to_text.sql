/*
  # Change ended_at to text type

  1. Changes
    - Alter `memberships.ended_at` from timestamptz to text
    - Preserve existing data by converting timestamps to ISO strings
  
  2. Reason
    - Ensures ISO string format is preserved exactly as stored
    - Prevents Postgres from auto-converting timestamp formats
    - Consistent with current_period_end column type
  
  3. Notes
    - Existing timestamps will be converted to ISO strings
    - All future inserts must use ISO string format
*/

-- Convert existing timestamptz values to text (ISO strings)
ALTER TABLE memberships 
  ALTER COLUMN ended_at TYPE text 
  USING CASE 
    WHEN ended_at IS NOT NULL 
    THEN to_char(ended_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ELSE NULL 
  END;
