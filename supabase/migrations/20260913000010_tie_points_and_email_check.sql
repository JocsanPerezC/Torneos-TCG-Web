-- Configurable score awarded to every player still alive when a pod ends tied.
alter table public.scoring_rules
  add column if not exists tie_points integer not null default 3 check (tie_points >= 0);

-- Used by registration to provide a clear duplicate-email message before sign-up.
-- It deliberately returns only a boolean and accepts normalized addresses.
create or replace function public.is_email_registered(candidate_email text)
returns boolean
language sql
stable
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(candidate_email))
  );
$$;

grant execute on function public.is_email_registered(text) to anon, authenticated;
