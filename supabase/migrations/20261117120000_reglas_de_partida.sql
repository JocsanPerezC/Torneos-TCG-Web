-- Reglas configurables por torneo. Los defaults preservan el comportamiento histórico.

ALTER TABLE public.tournaments
  ADD COLUMN tracks_kills boolean DEFAULT true NOT NULL,
  ADD COLUMN tracks_first_blood boolean DEFAULT false NOT NULL;

ALTER TABLE public.pod_results
  ADD COLUMN first_blood boolean DEFAULT false NOT NULL;

CREATE UNIQUE INDEX pod_results_one_first_blood_per_pod
  ON public.pod_results (pod_id)
  WHERE first_blood;

ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_max_players_check;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_max_players_check CHECK (max_players >= 3 AND max_players <= 256);
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_max_tables_check;
ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_max_tables_check CHECK (max_tables >= 1 AND max_tables <= 64);

-- La vista pública debe conocer las reglas y la primera sangre de cada resultado.
CREATE OR REPLACE FUNCTION public.get_public_tournament(slug text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'information', t.information, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'tracksKills', t.tracks_kills, 'tracksFirstBlood', t.tracks_first_blood,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker,
      'avatarUrl', p.avatar_url,
      'deck', case when p.deck_name is null then null else jsonb_build_object(
        'name', p.deck_name, 'url', p.deck_url, 'commander', p.deck_commander,
        'commanderImage', p.deck_commander_image, 'colors', p.deck_colors
      ) end
    ) order by p.name) from players p where p.tournament_id = t.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'finishedAt', po.finished_at, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id = po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'firstBlood', pr.first_blood, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id = po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id = r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id = t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug = slug and t.is_public = true;
$$;

-- El snapshot se usa en cambios de torneo y debe conservar también las reglas y la primera sangre.
CREATE OR REPLACE FUNCTION public.save_tournament_snapshot(snapshot jsonb) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  target_tournament_id uuid := (snapshot->>'id')::uuid;
begin
  if not public.is_tournament_owner(target_tournament_id) then
    raise exception 'Not authorized to update this tournament';
  end if;

  update public.tournaments t
  set name = snapshot->>'name',
      format = snapshot->>'format',
      information = left(coalesce(snapshot->>'information', ''), 2000),
      planned_rounds = (snapshot->>'plannedRounds')::integer,
      status = (snapshot->>'status')::public.tournament_status,
      is_public = coalesce((snapshot->>'isPublic')::boolean, true),
      max_players = coalesce((snapshot->>'maxPlayers')::integer, t.max_players),
      max_tables = coalesce((snapshot->>'maxTables')::integer, t.max_tables),
      tracks_kills = coalesce((snapshot->>'tracksKills')::boolean, true),
      tracks_first_blood = coalesce((snapshot->>'tracksFirstBlood')::boolean, false)
  where t.id = target_tournament_id;

  delete from public.rounds r
  where r.tournament_id = target_tournament_id
    and not exists (select 1 from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) item where (item->>'id')::uuid = r.id);

  delete from public.players p
  where p.tournament_id = target_tournament_id
    and not exists (select 1 from jsonb_array_elements(coalesce(snapshot->'players', '[]'::jsonb)) item where (item->>'id')::uuid = p.id);

  insert into public.players (id, tournament_id, name, is_active, tie_breaker)
  select (item->>'id')::uuid, target_tournament_id, item->>'name', coalesce((item->>'active')::boolean, true), coalesce((item->>'tieBreaker')::integer, 0)
  from jsonb_array_elements(coalesce(snapshot->'players', '[]'::jsonb)) item
  on conflict (id) do update set name = excluded.name, is_active = excluded.is_active, tie_breaker = excluded.tie_breaker;

  insert into public.rounds (id, tournament_id, number, status, seed, started_at, ended_at)
  select (item->>'id')::uuid, target_tournament_id, (item->>'number')::integer, (item->>'status')::public.round_status, (item->>'seed')::bigint,
         nullif(item->>'startedAt', '')::timestamptz, nullif(item->>'endedAt', '')::timestamptz
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) item
  on conflict (id) do update set number = excluded.number, status = excluded.status, seed = excluded.seed, started_at = excluded.started_at, ended_at = excluded.ended_at;

  insert into public.pods (id, round_id, number, result_type, notes)
  select (pod->>'id')::uuid, (round->>'id')::uuid, (pod->>'number')::integer, null, nullif(pod->>'notes', '')
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  on conflict (id) do update set number = excluded.number, result_type = null, notes = excluded.notes;

  delete from public.pod_players pp
  where pp.pod_id in (select (pod->>'id')::uuid from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod);

  insert into public.pod_players (pod_id, player_id)
  select (pod->>'id')::uuid, player_id::uuid
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements_text(coalesce(pod->'playerIds', '[]'::jsonb)) player_id;

  delete from public.pod_results pr
  where pr.pod_id in (select (pod->>'id')::uuid from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod);

  insert into public.pod_results (pod_id, player_id, position, kills, first_blood, is_dead, points, outcome)
  select (pod->>'id')::uuid, (result->>'playerId')::uuid, null, coalesce((result->>'kills')::integer, 0),
         coalesce((result->>'firstBlood')::boolean, false), false, (result->>'points')::integer,
         nullif(result->>'outcome', '')::public.pod_result_outcome
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements(coalesce(pod->'results', '[]'::jsonb)) result;
end;
$$;

-- Las consultas de historial conservan el mismo orden que la clasificación del cliente.
CREATE OR REPLACE FUNCTION public.get_my_player_statistics() RETURNS TABLE(tournaments_played integer, rounds_played integer, wins integer, losses integer, draws integer, points integer, kills integer, podiums integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role::text = 'player') then
    raise exception 'Only player accounts can view player statistics';
  end if;

  return query
    with linked_entries as (
      select p.id as player_id, p.tournament_id from public.players p where p.profile_id = auth.uid()
    ),
    linked_tournaments as (select distinct tournament_id from linked_entries),
    complete_pods as (
      select pod.id as pod_id
      from public.pods pod
      join public.rounds round on round.id = pod.round_id
      join linked_tournaments linked on linked.tournament_id = round.tournament_id
      where (select count(*) from public.pod_players seat where seat.pod_id = pod.id)
        = (select count(*) from public.pod_results result where result.pod_id = pod.id and result.outcome is not null)
    ),
    all_totals as (
      select p.tournament_id, p.id as player_id,
        count(pr.pod_id)::integer as rounds_played,
        count(*) filter (where pr.outcome = 'win' and cp.pod_id is not null)::integer as wins,
        count(*) filter (where pr.outcome = 'loss' and cp.pod_id is not null)::integer as losses,
        count(*) filter (where pr.outcome = 'draw' and cp.pod_id is not null)::integer as draws,
        coalesce(sum(pr.points), 0)::integer as points,
        coalesce(sum(case when tournament.tracks_kills then pr.kills else 0 end), 0)::integer as kills
      from public.players p
      join linked_tournaments linked on linked.tournament_id = p.tournament_id
      join public.tournaments tournament on tournament.id = p.tournament_id
      left join public.pod_results pr on pr.player_id = p.id
      left join complete_pods cp on cp.pod_id = pr.pod_id
      group by p.tournament_id, p.id, tournament.tracks_kills
    ),
    opponent_strength as (
      select own.tournament_id, own.player_id, coalesce(avg(opponent.points), 0) as value
      from all_totals own
      left join public.pod_results own_result on own_result.player_id = own.player_id
      left join public.pod_results opponent_result on opponent_result.pod_id = own_result.pod_id and opponent_result.player_id <> own.player_id
      left join all_totals opponent on opponent.tournament_id = own.tournament_id and opponent.player_id = opponent_result.player_id
      group by own.tournament_id, own.player_id
    ),
    finished_ranks as (
      select totals.tournament_id, totals.player_id,
        rank() over (partition by totals.tournament_id order by totals.points desc, totals.wins desc, totals.draws desc, totals.losses asc,
          case when totals.wins + totals.losses + totals.draws > 0 then (totals.wins + totals.draws * 0.5) / (totals.wins + totals.losses + totals.draws) else 0 end desc,
          totals.kills desc, strength.value desc) as position
      from all_totals totals
      join public.tournaments tournament on tournament.id = totals.tournament_id
      join opponent_strength strength on strength.tournament_id = totals.tournament_id and strength.player_id = totals.player_id
      where tournament.status = 'finalizado' or (select count(*) from public.rounds round where round.tournament_id = tournament.id and round.status = 'completada') >= tournament.planned_rounds
    )
    select count(entry.player_id)::integer, coalesce(sum(totals.rounds_played), 0)::integer,
      coalesce(sum(totals.wins), 0)::integer, coalesce(sum(totals.losses), 0)::integer,
      coalesce(sum(totals.draws), 0)::integer, coalesce(sum(totals.points), 0)::integer,
      coalesce(sum(totals.kills), 0)::integer, (count(rank.position) filter (where rank.position <= 3))::integer
    from linked_entries entry
    left join all_totals totals on totals.tournament_id = entry.tournament_id and totals.player_id = entry.player_id
    left join finished_ranks rank on rank.tournament_id = entry.tournament_id and rank.player_id = entry.player_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_my_player_tournament_results() RETURNS TABLE(tournament_id uuid, name text, format text, public_slug text, created_at timestamp with time zone, player_count integer, "position" integer, is_final boolean, rounds_played integer, wins integer, losses integer, draws integer, points integer, kills integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role::text = 'player') then
    raise exception 'Only player accounts can view player statistics';
  end if;

  return query
    with linked_entries as (
      select p.id as player_id, p.tournament_id from public.players p where p.profile_id = auth.uid()
    ),
    linked_tournaments as (select distinct tournament_id from linked_entries),
    complete_pods as (
      select pod.id as pod_id
      from public.pods pod
      join public.rounds round on round.id = pod.round_id
      join linked_tournaments linked on linked.tournament_id = round.tournament_id
      where (select count(*) from public.pod_players seat where seat.pod_id = pod.id)
        = (select count(*) from public.pod_results result where result.pod_id = pod.id and result.outcome is not null)
    ),
    all_totals as (
      select p.tournament_id, p.id as player_id,
        count(pr.pod_id)::integer as rounds_played,
        count(*) filter (where pr.outcome = 'win' and cp.pod_id is not null)::integer as wins,
        count(*) filter (where pr.outcome = 'loss' and cp.pod_id is not null)::integer as losses,
        count(*) filter (where pr.outcome = 'draw' and cp.pod_id is not null)::integer as draws,
        coalesce(sum(pr.points), 0)::integer as points,
        coalesce(sum(case when tournament.tracks_kills then pr.kills else 0 end), 0)::integer as kills
      from public.players p
      join linked_tournaments linked on linked.tournament_id = p.tournament_id
      join public.tournaments tournament on tournament.id = p.tournament_id
      left join public.pod_results pr on pr.player_id = p.id
      left join complete_pods cp on cp.pod_id = pr.pod_id
      group by p.tournament_id, p.id, tournament.tracks_kills
    ),
    opponent_strength as (
      select own.tournament_id, own.player_id, coalesce(avg(opponent.points), 0) as value
      from all_totals own
      left join public.pod_results own_result on own_result.player_id = own.player_id
      left join public.pod_results opponent_result on opponent_result.pod_id = own_result.pod_id and opponent_result.player_id <> own.player_id
      left join all_totals opponent on opponent.tournament_id = own.tournament_id and opponent.player_id = opponent_result.player_id
      group by own.tournament_id, own.player_id
    ),
    ranks as (
      select totals.tournament_id, totals.player_id,
        (rank() over (partition by totals.tournament_id order by totals.points desc, totals.wins desc, totals.draws desc, totals.losses asc,
          case when totals.wins + totals.losses + totals.draws > 0 then (totals.wins + totals.draws * 0.5) / (totals.wins + totals.losses + totals.draws) else 0 end desc,
          totals.kills desc, strength.value desc))::integer as position,
        (count(*) over (partition by totals.tournament_id))::integer as player_count
      from all_totals totals
      join opponent_strength strength on strength.tournament_id = totals.tournament_id and strength.player_id = totals.player_id
    )
    select tournament.id, tournament.name, tournament.format, tournament.public_slug, tournament.created_at,
      rank.player_count, rank.position,
      (tournament.status = 'finalizado' or (select count(*) from public.rounds round where round.tournament_id = tournament.id and round.status = 'completada') >= tournament.planned_rounds),
      totals.rounds_played, totals.wins, totals.losses, totals.draws, totals.points, totals.kills
    from linked_entries entry
    join public.tournaments tournament on tournament.id = entry.tournament_id
    join all_totals totals on totals.tournament_id = entry.tournament_id and totals.player_id = entry.player_id
    join ranks rank on rank.tournament_id = entry.tournament_id and rank.player_id = entry.player_id
    order by tournament.created_at desc;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_my_recent_results(p_limit integer DEFAULT 5) RETURNS TABLE(tournament_name text, round_number integer, outcome text, points integer, kills integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role::text = 'player') then
    raise exception 'Only player accounts can view player statistics';
  end if;

  return query
    select tournament.name, round.number, result.outcome::text, result.points,
      case when tournament.tracks_kills then result.kills else 0 end
    from public.players player
    join public.pod_results result on result.player_id = player.id
    join public.pods pod on pod.id = result.pod_id
    join public.rounds round on round.id = pod.round_id
    join public.tournaments tournament on tournament.id = round.tournament_id
    where player.profile_id = auth.uid() and result.outcome is not null
    order by coalesce(round.ended_at, round.started_at, tournament.created_at) desc, round.number desc
    limit least(greatest(coalesce(p_limit, 5), 1), 20);
end;
$$;
