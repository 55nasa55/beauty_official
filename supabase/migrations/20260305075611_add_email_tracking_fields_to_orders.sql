/*
  # Add Email Tracking Fields to Orders Table

  1. Changes
    - Add `tracking_email_sent` (boolean, default false) - tracks if shipping notification email was sent
    - Add `delivery_email_sent` (boolean, default false) - tracks if delivery confirmation email was sent
  
  2. Purpose
    - Enable tracking of email notifications for order lifecycle events
    - Prevent duplicate email sends
    - Support automated email workflow via order sync jobs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_email_sent'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_email_sent boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_email_sent'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_email_sent boolean DEFAULT false NOT NULL;
  END IF;
END $$;
