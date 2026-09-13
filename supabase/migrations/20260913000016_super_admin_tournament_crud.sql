-- A super admin can operate on every tournament aggregate. Admins remain
-- read-only: their existing RLS policies only grant SELECT.
create or replace function public.is_tournament_owner(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.tournaments
      where id = tid and owner_id = auth.uid()
    );
$$;

create policy "super admin manage tournaments"
on public.tournaments for all
using (public.is_super_admin())
with check (public.is_super_admin());

-- The child-table policies already use is_tournament_owner(). Redefining that
-- helper above grants a super admin CREATE, READ, UPDATE and DELETE across a
-- complete tournament while leaving normal organizers owner-scoped.
