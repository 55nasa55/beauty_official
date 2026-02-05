create policy "Admins soft-delete any review"
on public.reviews
for update
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.id = auth.uid()
  )
)
with check (true);