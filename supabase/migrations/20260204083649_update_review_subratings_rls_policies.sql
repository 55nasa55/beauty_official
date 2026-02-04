/*
  # Update Review Subratings RLS Policies

  1. Security Policies
    - SELECT: Public read access
    - INSERT: Only review owner can insert subratings
    - UPDATE: Not allowed
    - DELETE: Only review owner can delete subratings

  2. Important Notes
    - Review subratings are tied to reviews
    - Only the review owner can manage their subratings
    - No updates allowed - delete and recreate instead
    - Must reference non-deleted reviews
*/

-- Drop all existing review_subratings policies
drop policy if exists "Anyone can view review subratings" on public.review_subratings;
drop policy if exists "Users can insert subratings for their own reviews" on public.review_subratings;
drop policy if exists "Users can update their own review subratings" on public.review_subratings;
drop policy if exists "Users can delete their own review subratings" on public.review_subratings;
drop policy if exists "Review subratings are public" on public.review_subratings;
drop policy if exists "Users insert subratings for their own reviews" on public.review_subratings;
drop policy if exists "Users cannot update review_subratings" on public.review_subratings;
drop policy if exists "Users delete their review subratings" on public.review_subratings;

alter table public.review_subratings enable row level security;

-- SELECT: public
create policy "Review subratings are public"
  on public.review_subratings
  for select
  using (true);

-- INSERT: only the review owner may insert rows
create policy "Users insert subratings for their own reviews"
  on public.review_subratings
  for insert
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
      and r.user_id = auth.uid()
      and r.deleted_at is null
    )
  );

-- UPDATE: not allowed
create policy "Users cannot update review_subratings"
  on public.review_subratings
  for update
  using (false)
  with check (false);

-- DELETE: only allowed if the user owns the review
create policy "Users delete their review subratings"
  on public.review_subratings
  for delete
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_subratings.review_id
      and r.user_id = auth.uid()
    )
  );
