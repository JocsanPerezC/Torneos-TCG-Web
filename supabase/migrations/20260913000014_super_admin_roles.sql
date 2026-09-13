-- Keep the existing role data and add the elevated role separately so current
-- administrators remain administrators until a super administrator promotes them.
alter type public.app_role add value if not exists 'super_admin';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'super_admin'
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- Only a super administrator can grant, revoke, or delegate roles. An admin
-- retains global read-only access but cannot elevate accounts.
create or replace function public.set_profile_role(target_profile_id uuid, next_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super administrator can change roles';
  end if;

  if target_profile_id = auth.uid() and next_role::text <> 'super_admin' then
    raise exception 'A super administrator cannot remove their own role';
  end if;

  update public.profiles set role = next_role where id = target_profile_id;
  if not found then raise exception 'Profile not found'; end if;
end;
$$;

revoke all on function public.set_profile_role(uuid, public.app_role) from public;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;

-- Promote the first super administrator once from the SQL Editor:
-- update public.profiles set role = 'super_admin' where id = 'YOUR-USER-UUID';
