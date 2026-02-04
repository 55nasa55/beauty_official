/*
  # Update Product Subratings RLS Policies

  1. Security Policies
    - SELECT: Public read access
    - INSERT/UPDATE/DELETE: Admins only

  2. Important Notes
    - Product subratings are admin-defined review attributes
    - Only admins can manage these (create, update, delete)
    - Public users can view all subratings
*/

-- Drop all existing product_subratings policies
drop policy if exists "Anyone can view product subratings" on public.product_subratings;
drop policy if exists "Only admins can insert product subratings" on public.product_subratings;
drop policy if exists "Only admins can update product subratings" on public.product_subratings;
drop policy if exists "Only admins can delete product subratings" on public.product_subratings;
drop policy if exists "Product subratings are public" on public.product_subratings;
drop policy if exists "Admins can manage product subratings" on public.product_subratings;

alter table public.product_subratings enable row level security;

-- SELECT: public readable
create policy "Product subratings are public"
  on public.product_subratings
  for select
  using (true);

-- INSERT/UPDATE/DELETE: admins only
create policy "Admins can manage product subratings"
  on public.product_subratings
  for all
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  );
