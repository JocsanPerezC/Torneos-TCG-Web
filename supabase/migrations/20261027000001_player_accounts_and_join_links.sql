-- Player accounts remain distinct from organizer accounts. A tournament may
-- still contain manual participants without an account.

alter table public.players
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

alter table public.profiles
  add column if not exists role_locked boolean not null default true;

create unique index if not exists players_tournament_profile_unique
  on public.players (tournament_id, profile_id)
  where profile_id is not null;

create index if not exists players_profile_idx on public.players (profile_id);

create table if not exists public.tournament_join_links (
  tournament_id uuid primary key references public.tournaments(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.tournament_join_links enable row level security;

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
      and role::text in ('organizer', 'admin', 'super_admin')
  );
$$;

revoke all on function public.is_organizer() from public;
grant execute on function public.is_organizer() to authenticated;

create or replace function public.is_tournament_owner(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (
      public.is_organizer()
      and exists (
        select 1
        from public.tournaments
        where id = tid and owner_id = auth.uid()
      )
    );
$$;

drop policy if exists "owner tournament" on public.tournaments;
drop policy if exists "super admin manage tournaments" on public.tournaments;
drop policy if exists "organizer read tournaments" on public.tournaments;
drop policy if exists "organizer create tournaments" on public.tournaments;
drop policy if exists "organizer update tournaments" on public.tournaments;
drop policy if exists "organizer delete tournaments" on public.tournaments;

create policy "organizer read tournaments"
on public.tournaments for select
using (public.is_tournament_owner(id));

create policy "organizer create tournaments"
on public.tournaments for insert
with check (owner_id = auth.uid() and public.is_organizer());

create policy "organizer update tournaments"
on public.tournaments for update
using (public.is_tournament_owner(id))
with check (
  public.is_super_admin()
  or (owner_id = auth.uid() and public.is_organizer())
);

create policy "organizer delete tournaments"
on public.tournaments for delete
using (public.is_tournament_owner(id));

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
      select 1 from public.profiles where id = new.profile_id and role::text = 'player'
    ) then
      raise exception 'Only player accounts can be linked to a participant';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists players_require_player_profile on public.players;
create trigger players_require_player_profile
before insert or update of profile_id on public.players
for each row execute function public.enforce_player_profile_link();

create or replace function public.create_or_rotate_tournament_join_link(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token text := encode(gen_random_bytes(24), 'hex');
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  insert into public.tournament_join_links (tournament_id, token, revoked_at)
  values (p_tournament_id, next_token, null)
  on conflict (tournament_id) do update
    set token = excluded.token,
        created_at = now(),
        revoked_at = null;

  return next_token;
end;
$$;

create or replace function public.get_tournament_join_link(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_token text;
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  select token into current_token
  from public.tournament_join_links
  where tournament_id = p_tournament_id and revoked_at is null;

  return current_token;
end;
$$;

create or replace function public.revoke_tournament_join_link(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  update public.tournament_join_links
  set revoked_at = now()
  where tournament_id = p_tournament_id and revoked_at is null;
end;
$$;

create or replace function public.get_joinable_tournament(p_token text)
returns table (
  tournament_id uuid,
  name text,
  format text,
  available_slots integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.name,
    t.format,
    greatest(0, t.max_players - count(p.id)::integer)
  from public.tournament_join_links link
  join public.tournaments t on t.id = link.tournament_id
  left join public.players p on p.tournament_id = t.id
  where link.token = p_token
    and link.revoked_at is null
    and t.status = 'activo'
  group by t.id, t.name, t.format, t.max_players;
$$;

create or replace function public.join_tournament(p_token text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tournament_record public.tournaments%rowtype;
  participant_id uuid;
  display_name text := trim(p_name);
  next_tie_breaker integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'player'
  ) then
    raise exception 'Only player accounts can join a tournament';
  end if;

  select t.* into tournament_record
  from public.tournament_join_links link
  join public.tournaments t on t.id = link.tournament_id
  where link.token = p_token
    and link.revoked_at is null
    and t.status = 'activo'
  for update of t;

  if not found then
    raise exception 'This invitation is unavailable';
  end if;

  select id into participant_id
  from public.players
  where tournament_id = tournament_record.id and profile_id = auth.uid();

  if participant_id is not null then
    return jsonb_build_object('tournamentId', tournament_record.id, 'playerId', participant_id);
  end if;

  if (select count(*) from public.players where tournament_id = tournament_record.id) >= tournament_record.max_players then
    raise exception 'This tournament is full';
  end if;

  if display_name = '' then
    raise exception 'A player name is required';
  end if;

  if exists (
    select 1
    from public.players
    where tournament_id = tournament_record.id
      and normalized_name = lower(display_name)
  ) then
    raise exception 'This player name is already registered in the tournament';
  end if;

  select coalesce(max(tie_breaker), 0) + 1 into next_tie_breaker
  from public.players
  where tournament_id = tournament_record.id;

  insert into public.players (tournament_id, name, is_active, tie_breaker, profile_id)
  values (tournament_record.id, display_name, true, next_tie_breaker, auth.uid())
  returning id into participant_id;

  return jsonb_build_object('tournamentId', tournament_record.id, 'playerId', participant_id);
end;
$$;

create or replace function public.get_my_player_tournaments()
returns table (
  tournament_id uuid,
  name text,
  format text,
  status public.tournament_status,
  public_slug text,
  planned_rounds integer,
  round_count integer,
  participant_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'player'
  ) then
    raise exception 'Only player accounts can view player tournaments';
  end if;

  return query
    select
      t.id,
      t.name,
      t.format,
      t.status,
      t.public_slug,
      t.planned_rounds,
      count(r.id)::integer,
      p.name,
      t.created_at
    from public.players p
    join public.tournaments t on t.id = p.tournament_id
    left join public.rounds r on r.tournament_id = t.id
    where p.profile_id = auth.uid()
    group by t.id, p.id
    order by t.status = 'activo' desc, t.created_at desc;
end;
$$;

revoke all on function public.create_or_rotate_tournament_join_link(uuid) from public;
revoke all on function public.get_tournament_join_link(uuid) from public;
revoke all on function public.revoke_tournament_join_link(uuid) from public;
revoke all on function public.get_joinable_tournament(text) from public;
revoke all on function public.join_tournament(text, text) from public;
revoke all on function public.get_my_player_tournaments() from public;
grant execute on function public.create_or_rotate_tournament_join_link(uuid) to authenticated;
grant execute on function public.get_tournament_join_link(uuid) to authenticated;
grant execute on function public.revoke_tournament_join_link(uuid) to authenticated;
grant execute on function public.get_joinable_tournament(text) to authenticated;
grant execute on function public.join_tournament(text, text) to authenticated;
grant execute on function public.get_my_player_tournaments() to authenticated;

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
    case when new.raw_user_meta_data ->> 'requested_role' = 'player' then 'player'::public.app_role else 'organizer'::public.app_role end,
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') <> 'google',
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

create or replace function public.complete_google_signup_role(next_role public.app_role)
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

revoke all on function public.complete_google_signup_role(public.app_role) from public;
grant execute on function public.complete_google_signup_role(public.app_role) to authenticated;
