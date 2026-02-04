/*
  # Create Review Subratings Table

  1. New Tables
    - `review_subratings`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key to reviews)
      - `subrating_id` (uuid, foreign key to product_subratings)
      - `value` (integer, 1-5 stars)
      - Unique constraint: one value per subrating per review

  2. Security
    - Enable RLS on `review_subratings` table
    - Anyone can view review subratings
    - Users can only insert subratings for their own reviews
    - Users can only update their own review subratings
    - Users can only delete their own review subratings
*/

create table if not exists public.review_subratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  subrating_id uuid not null references public.product_subratings(id) on delete cascade,
  value int not null check (value >= 1 and value <= 5)
);

create unique index if not exists review_subratings_unique
  on public.review_subratings(review_id, subrating_id);

alter table public.review_subratings enable row level security;

create policy "Anyone can view review subratings"
  on public.review_subratings
  for select
  using (true);

create policy "Users can insert subratings for their own reviews"
  on public.review_subratings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reviews
      where reviews.id = review_id
      and reviews.user_id = auth.uid()
    )
  );

create policy "Users can update their own review subratings"
  on public.review_subratings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.reviews
      where reviews.id = review_id
      and reviews.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.reviews
      where reviews.id = review_id
      and reviews.user_id = auth.uid()
    )
  );

create policy "Users can delete their own review subratings"
  on public.review_subratings
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.reviews
      where reviews.id = review_id
      and reviews.user_id = auth.uid()
    )
  );
