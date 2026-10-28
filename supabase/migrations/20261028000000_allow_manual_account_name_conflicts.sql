-- A linked player may share a name with exactly one manual participant. This
-- preserves the manual registration flow while allowing a real account to join.
alter table public.players
  drop constraint if exists players_tournament_id_normalized_name_key;

create unique index if not exists players_tournament_manual_name_key
  on public.players (tournament_id, normalized_name)
  where profile_id is null;

create unique index if not exists players_tournament_account_name_key
  on public.players (tournament_id, normalized_name)
  where profile_id is not null;

create or replace function public.enforce_resolved_participant_names()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.players manual_player
    join public.players account_player
      on account_player.tournament_id = manual_player.tournament_id
     and account_player.normalized_name = manual_player.normalized_name
     and account_player.profile_id is not null
    where manual_player.tournament_id = new.tournament_id
      and manual_player.profile_id is null
  ) then
    raise exception 'Rename the manual participant with the duplicate name before generating a round';
  end if;

  return new;
end;
$$;

drop trigger if exists rounds_require_resolved_participant_names on public.rounds;
create trigger rounds_require_resolved_participant_names
before insert on public.rounds
for each row execute function public.enforce_resolved_participant_names();

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
  where (link.token = lower(p_token) or link.code = upper(p_token))
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
      and profile_id is not null
  ) then
    raise exception 'A linked player account already uses this name in the tournament';
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

revoke all on function public.enforce_resolved_participant_names() from public;
