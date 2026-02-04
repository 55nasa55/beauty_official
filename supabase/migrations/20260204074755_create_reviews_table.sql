/*
  # Create Reviews Table

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `variant_id` (uuid, foreign key to product_variants, nullable)
      - `user_id` (uuid, foreign key to auth.users)
      - `rating` (integer, 1-5 stars)
      - `body` (text, review content)
      - `images` (text array, optional review images)
      - `created_at` (timestamptz)
      - `deleted_at` (timestamptz, for soft delete)
      - Unique constraint: one review per user per product

  2. Security
    - Enable RLS on `reviews` table
    - Users can view non-deleted reviews
    - Users can insert their own reviews
    - Users can update their own non-deleted reviews
    - Users can soft-delete their own reviews
*/

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  body text not null,
  images text[] default array[]::text[],
  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint reviews_user_product_unique unique (user_id, product_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view non-deleted reviews"
  on public.reviews
  for select
  using (deleted_at is null);

create policy "Authenticated users can insert their own reviews"
  on public.reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own non-deleted reviews"
  on public.reviews
  for update
  to authenticated
  using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy "Users can soft-delete their own reviews"
  on public.reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and deleted_at is not null);
