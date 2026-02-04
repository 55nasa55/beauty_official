/*
  # Create Review Images Storage Bucket

  1. Storage Bucket
    - `review_images` - Public bucket for review image uploads

  2. Storage Policies
    - Public read access for all images
    - Authenticated users can upload images
    - Users can only delete their own uploaded images

  3. Important Notes
    - Images organized by user ID folder: {user_id}/filename
    - Public bucket allows direct access to images
    - Delete policy validates folder ownership
*/

-- Drop existing storage policies if any
drop policy if exists "Public read review images" on storage.objects;
drop policy if exists "Authenticated users upload review images" on storage.objects;
drop policy if exists "Users delete their own review images" on storage.objects;

-- Create storage bucket for review images
insert into storage.buckets (id, name, public)
values ('review_images', 'review_images', true)
on conflict (id) do nothing;

-- Allow public read
create policy "Public read review images"
  on storage.objects
  for select
  using (bucket_id = 'review_images');

-- Allow authenticated upload
create policy "Authenticated users upload review images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'review_images'
    and auth.role() = 'authenticated'
  );

-- Allow user to delete only their own uploaded images
-- (review routes will also validate)
create policy "Users delete their own review images"
  on storage.objects
  for delete
  using (
    bucket_id = 'review_images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
