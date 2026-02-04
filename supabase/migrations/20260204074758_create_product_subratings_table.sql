/*
  # Create Product Subratings Table

  1. New Tables
    - `product_subratings`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `name` (text, attribute name like "Moisturizing")
      - `display_order` (integer, for sorting)
      - Unique constraint: product cannot have duplicate subrating names

  2. Security
    - Enable RLS on `product_subratings` table
    - Anyone can view subratings
    - Only admins can create, update, or delete subratings
*/

create table if not exists public.product_subratings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  display_order int not null default 0
);

create unique index if not exists product_subratings_unique_per_product
  on public.product_subratings(product_id, name);

alter table public.product_subratings enable row level security;

create policy "Anyone can view product subratings"
  on public.product_subratings
  for select
  using (true);

create policy "Only admins can insert product subratings"
  on public.product_subratings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admins
      where admins.id = auth.uid()
    )
  );

create policy "Only admins can update product subratings"
  on public.product_subratings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.admins
      where admins.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins
      where admins.id = auth.uid()
    )
  );

create policy "Only admins can delete product subratings"
  on public.product_subratings
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.admins
      where admins.id = auth.uid()
    )
  );
