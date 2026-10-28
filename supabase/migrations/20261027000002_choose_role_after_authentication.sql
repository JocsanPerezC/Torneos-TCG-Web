-- A newly authenticated account must choose its capabilities before it can act
-- as an organizer or join as a player. The choice is finalized exactly once.

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

create or replace function public.enforce_player_profile_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.profile_id is not null then
    if new.profile_id <> auth.uid() then
      raise exception 'A participant can only be linked by its own account';
    end if;
    if not exists (
      select 1
      from public.profiles
      where id = new.profile_id
        and role_locked
        and role::text = 'player'
    ) then
      raise exception 'Only player accounts can be linked to a participant';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, display_name, auth_provider, role, role_locked, terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version, legal_consent_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end,
    'organizer'::public.app_role,
    false,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then now() end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then '2026-09-22' end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then now() end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then '2026-09-22' end,
    coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') <> 'true'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.complete_signup_role(next_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if next_role::text not in ('player', 'organizer') then
    raise exception 'Invalid signup role';
  end if;

  update public.profiles
  set role = next_role, role_locked = true
  where id = auth.uid() and role_locked = false;

  if not found then
    raise exception 'The account role is already assigned';
  end if;
end;
$$;

revoke all on function public.complete_signup_role(public.app_role) from public;
grant execute on function public.complete_signup_role(public.app_role) to authenticated;

-- Replaced by complete_signup_role so stale clients cannot bypass the selection screen.
revoke all on function public.complete_google_signup_role(public.app_role) from authenticated;
