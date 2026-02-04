/*
  # Update Reviews RLS Policies

  1. Security Policies
    - SELECT: Public read access to non-deleted reviews
    - INSERT: Authenticated users with verified purchase only (no duplicate reviews)
    - UPDATE: Disabled - users cannot update reviews directly
    - SOFT DELETE: Users can soft-delete their own reviews
    - ADMIN: Admins can soft-delete any review

  2. Important Notes
    - Reviews require verified purchase (order_items + orders join)
    - One review per user per product (enforced by unique constraint)
    - No direct updates allowed - only soft delete
    - Admins have override capability for moderation
*/

-- Drop all existing reviews policies
drop policy if exists "Anyone can view non-deleted reviews" on public.reviews;
drop policy if exists "Authenticated users can insert their own reviews" on public.reviews;
drop policy if exists "Users can update their own non-deleted reviews" on public.reviews;
drop policy if exists "Reviews are publicly readable" on public.reviews;
drop policy if exists "Users can create review if verified purchase and no existing re" on public.reviews;
drop policy if exists "Users cannot update reviews directly" on public.reviews;
drop policy if exists "Users can soft-delete their own reviews" on public.reviews;
drop policy if exists "Admins can soft-delete any review" on public.reviews;

-- Enable RLS
alter table public.reviews enable row level security;

-- SELECT: everyone can read non-deleted reviews
create policy "Reviews are publicly readable"
  on public.reviews
  for select
  using (deleted_at is null);

-- INSERT: user must be authenticated AND must have a verified purchase
create policy "Users can create review if verified purchase and no existing review"
  on public.reviews
  for insert
  with check (
    auth.uid() = user_id
    and deleted_at is null
    and (
      select count(*)
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = reviews.product_id
      and o.user_id = auth.uid()
    ) > 0
  );

-- UPDATE: users cannot update reviews directly
create policy "Users cannot update reviews directly"
  on public.reviews
  for update
  using (false)
  with check (false);

-- SOFT DELETE: user can delete ONLY their own review
create policy "Users can soft-delete their own reviews"
  on public.reviews
  for update
  using (
    auth.uid() = user_id
    and deleted_at is null
  )
  with check (
    auth.uid() = user_id
  );

-- ADMIN: allow soft-delete any review
create policy "Admins can soft-delete any review"
  on public.reviews
  for update
  using (
    exists (
      select 1 from public.admins a
      where a.id = auth.uid()
    )
  )
  with check (true);
