create type public.pod_result_outcome as enum ('win', 'loss', 'draw');

alter table public.pod_results
  add column outcome public.pod_result_outcome;

create or replace function public.save_tournament_snapshot(snapshot jsonb)
returns void
language plpgsql
set search_path = public
as $$
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
      is_public = coalesce((snapshot->>'isPublic')::boolean, true)
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

  insert into public.pod_results (pod_id, player_id, position, kills, is_dead, points, outcome)
  select (pod->>'id')::uuid, (result->>'playerId')::uuid, null, (result->>'kills')::integer, false, (result->>'points')::integer,
         nullif(result->>'outcome', '')::public.pod_result_outcome
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements(coalesce(pod->'results', '[]'::jsonb)) result;
end;
$$;

create or replace function public.get_public_tournament(slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'information', t.information, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'players', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker) order by p.name) from players p where p.tournament_id=t.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id=po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id=po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id=r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id=t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug=slug and t.is_public=true;
$$;
