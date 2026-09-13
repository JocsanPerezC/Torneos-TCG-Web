-- super_admin is a break-glass role: it can only be assigned by a privileged
-- database operator in Supabase, never through the browser-facing RPC.
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

  if next_role::text = 'super_admin' then
    raise exception 'The super_admin role can only be assigned from the database';
  end if;

  if target_profile_id = auth.uid() then
    raise exception 'A super administrator cannot change their own role';
  end if;

  update public.profiles set role = next_role where id = target_profile_id;
  if not found then raise exception 'Profile not found'; end if;
end;
$$;

revoke all on function public.set_profile_role(uuid, public.app_role) from public;
grant execute on function public.set_profile_role(uuid, public.app_role) to authenticated;
