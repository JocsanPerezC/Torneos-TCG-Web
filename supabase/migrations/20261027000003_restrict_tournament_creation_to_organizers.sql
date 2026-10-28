-- Administrative accounts have their own console and cannot own tournaments.
create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role_locked
      and role::text = 'organizer'
  );
$$;
