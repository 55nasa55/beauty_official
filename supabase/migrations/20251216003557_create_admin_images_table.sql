/*
  # Create admin_images table for image indexing

  1. New Tables
    - `admin_images`
      - `id` (uuid, primary key) - Unique identifier
      - `bucket` (text, not null) - Storage bucket name (always 'product-images')
      - `path` (text, not null, unique) - Storage file path/name
      - `created_at` (timestamptz, not null, default now()) - Upload timestamp
      - `bytes` (int8, nullable) - File size in bytes
      - `mime_type` (text, nullable) - MIME type of the image
      - `width` (int, nullable) - Image width in pixels
      - `height` (int, nullable) - Image height in pixels
      - `tags` (text[], nullable) - Optional tags for categorization

  2. Indexes
    - Index on `created_at` for sorting
    - Index on `path` for fast lookups (via unique constraint)
    - Index on `bucket` for filtering

  3. Security
    - Enable RLS on `admin_images` table
    - No public access - admin-only access (to be implemented with auth)
*/

CREATE TABLE IF NOT EXISTS admin_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'product-images',
  path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  bytes int8 NULL,
  mime_type text NULL,
  width int NULL,
  height int NULL,
  tags text[] NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_images_created_at ON admin_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_images_bucket ON admin_images(bucket);

-- Enable RLS (restrictive by default - no policies yet means no access)
ALTER TABLE admin_images ENABLE ROW LEVEL SECURITY;

-- Comment on table
COMMENT ON TABLE admin_images IS 'Indexes all images stored in Supabase Storage for efficient querying and pagination';