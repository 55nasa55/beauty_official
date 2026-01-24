/*
  # Change current_period_end to text type

  1. Changes
    - Alter `memberships.current_period_end` from timestamptz to text
    - Preserve existing data by converting timestamps to ISO strings
  
  2. Reason
    - Ensures ISO string format is preserved exactly as stored
    - Prevents Postgres from auto-converting timestamp formats
    - Allows frontend to correctly parse and display dates
  
  3. Notes
    - Existing timestamps will be converted to ISO strings
    - All future inserts must use ISO string format
*/

-- Convert existing timestamptz values to text (ISO strings)
ALTER TABLE memberships 
  ALTER COLUMN current_period_end TYPE text 
  USING CASE 
    WHEN current_period_end IS NOT NULL 
    THEN to_char(current_period_end AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ELSE NULL 
  END;
