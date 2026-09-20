-- Restore the organizer-facing tournament notes that are also shown in the public view.
alter table public.tournaments
  add column if not exists information text not null default ''
  check (char_length(information) <= 2000);

-- Older deployments retain this non-null compatibility column, while the
-- current client no longer sends materialized points in its snapshots.
alter table public.pod_results
  add column if not exists points integer not null default 0 check (points >= 0);

alter table public.pod_results
  alter column points set default 0;

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

  insert into public.scoring_rules (tournament_id, first_place, second_place, third_place, fourth_place, tie_points)
  values (target_tournament_id, (snapshot->'scoring'->>'first')::integer, (snapshot->'scoring'->>'second')::integer, (snapshot->'scoring'->>'third')::integer, (snapshot->'scoring'->>'fourth')::integer, (snapshot->'scoring'->>'tie')::integer)
  on conflict (tournament_id) do update set first_place = excluded.first_place, second_place = excluded.second_place, third_place = excluded.third_place, fourth_place = excluded.fourth_place, tie_points = excluded.tie_points;

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
  select (pod->>'id')::uuid, (round->>'id')::uuid, (pod->>'number')::integer, nullif(pod->>'resultType', '')::public.result_type, nullif(pod->>'notes', '')
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  on conflict (id) do update set number = excluded.number, result_type = excluded.result_type, notes = excluded.notes;

  delete from public.pod_players pp
  where pp.pod_id in (select (pod->>'id')::uuid from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod);

  insert into public.pod_players (pod_id, player_id)
  select (pod->>'id')::uuid, player_id::uuid
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements_text(coalesce(pod->'playerIds', '[]'::jsonb)) player_id;

  delete from public.pod_results pr
  where pr.pod_id in (select (pod->>'id')::uuid from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod);

  insert into public.pod_results (pod_id, player_id, position, kills, is_dead, points)
  select (pod->>'id')::uuid, (result->>'playerId')::uuid, (result->>'position')::integer, (result->>'kills')::integer, coalesce((result->>'dead')::boolean, false), coalesce((result->>'points')::integer, 0)
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
    'scoring', coalesce((select jsonb_build_object('first', s.first_place, 'second', s.second_place, 'third', s.third_place, 'fourth', s.fourth_place) from scoring_rules s where s.tournament_id=t.id), '{}'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id=po.id), '[]'::jsonb), 'resultType', po.result_type, 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'position', pr.position, 'kills', pr.kills, 'dead', pr.is_dead) order by pr.position) from pod_results pr where pr.pod_id=po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id=r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id=t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug=slug and t.is_public=true;
$$;

grant execute on function public.save_tournament_snapshot(jsonb) to authenticated;
grant execute on function public.get_public_tournament(text) to anon, authenticated;
