-----------------------------------------------------
-- Ensure all reviews always get user_email set
-----------------------------------------------------

create or replace function populate_review_user_email()
returns trigger
language plpgsql
as $$
declare
  u_email text;
begin
  select email into u_email
  from auth.users
  where id = new.user_id;

  if u_email is null then
    new.user_email := 'Anonymous';
  else
    new.user_email := u_email;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_populate_review_user_email on reviews;

create trigger trg_populate_review_user_email
before insert on reviews
for each row
execute function populate_review_user_email();

-----------------------------------------------------
