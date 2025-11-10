/*
  # Create Product Images Storage Bucket

  1. Storage Bucket Setup
    - Create `product-images` bucket for storing product and variation images
    - Enable public access for image viewing
    
  2. Storage Policies
    - Allow authenticated users (admins) to upload images
    - Allow authenticated users to delete images
    - Allow public read access to all images
*/

-- Create storage bucket for product images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to product images" ON storage.objects;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Policy: Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Policy: Allow public read access to all images
CREATE POLICY "Public read access to product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');