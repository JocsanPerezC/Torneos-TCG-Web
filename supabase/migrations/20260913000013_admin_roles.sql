-- Application roles are kept in public.profiles, never in user-editable metadata.
create type public.app_role as enum ('organizer', 'admin');

alter table public.profiles
  add column role public.app_role not null default 'organizer';

-- SECURITY DEFINER is intentional: it lets every RLS policy ask this question
-- without depending on the caller's ability to read other profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A client may read its own profile (or an admin may list profiles), but it
-- cannot create/delete profiles or write the role column directly. Profiles
-- are created exclusively by the auth trigger already present in this project.
revoke insert, delete on public.profiles from anon, authenticated;
revoke update (role) on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "admin read profiles"
on public.profiles for select
using (public.is_admin());

create policy "admin read tournaments"
on public.tournaments for select
using (public.is_admin());

create policy "admin read scoring rules"
on public.scoring_rules for select
using (public.is_admin());

create policy "admin read players"
on public.players for select
using (public.is_admin());

create policy "admin read rounds"
on public.rounds for select
using (public.is_admin());

create policy "admin read pods"
on public.pods for select
using (public.is_admin());

create policy "admin read pod players"
on public.pod_players for select
using (public.is_admin());

create policy "admin read pod results"
on public.pod_results for select
using (public.is_admin());

-- This RPC is the only supported future path for changing a role. The current
-- UI is intentionally read-only; it does not call this function yet.
create or replace function public.set_profile_role(target_profile_id uuid, next_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can change roles';
  end if;

  -- Avoid accidentally removing the last access path while role management is
  -- still limited to this protected RPC.
  if target_profile_id = auth.uid() and next_role <> 'admin' then
    raise exception 'An administrator cannot remove their own admin role';
  end if;

  update public.profiles
  set role = next_role
  where id = target_profile_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.set_profile_role(uuid, public.app_role) from public;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;

-- First administrator: execute once in the Supabase SQL Editor, replacing the
-- UUID with the id from Authentication > Users:
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
