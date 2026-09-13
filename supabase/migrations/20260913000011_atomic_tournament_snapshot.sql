create or replace function public.save_tournament_snapshot(snapshot jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  tournament_id uuid := (snapshot->>'id')::uuid;
begin
  if not public.is_tournament_owner(tournament_id) then
    raise exception 'Not authorized to update this tournament';
  end if;

  update public.tournaments
  set name = snapshot->>'name', format = snapshot->>'format', planned_rounds = (snapshot->>'plannedRounds')::integer,
      status = (snapshot->>'status')::public.tournament_status, is_public = coalesce((snapshot->>'isPublic')::boolean, true)
  where id = tournament_id;

  insert into public.scoring_rules (tournament_id, first_place, second_place, third_place, fourth_place, tie_points)
  values (tournament_id, (snapshot->'scoring'->>'first')::integer, (snapshot->'scoring'->>'second')::integer, (snapshot->'scoring'->>'third')::integer, (snapshot->'scoring'->>'fourth')::integer, (snapshot->'scoring'->>'tie')::integer)
  on conflict (tournament_id) do update set first_place = excluded.first_place, second_place = excluded.second_place, third_place = excluded.third_place, fourth_place = excluded.fourth_place, tie_points = excluded.tie_points;

  delete from public.rounds r
  where r.tournament_id = tournament_id
    and not exists (select 1 from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) item where (item->>'id')::uuid = r.id);

  delete from public.players p
  where p.tournament_id = tournament_id
    and not exists (select 1 from jsonb_array_elements(coalesce(snapshot->'players', '[]'::jsonb)) item where (item->>'id')::uuid = p.id);

  insert into public.players (id, tournament_id, name, is_active, tie_breaker)
  select (item->>'id')::uuid, tournament_id, item->>'name', coalesce((item->>'active')::boolean, true), coalesce((item->>'tieBreaker')::integer, 0)
  from jsonb_array_elements(coalesce(snapshot->'players', '[]'::jsonb)) item
  on conflict (id) do update set name = excluded.name, is_active = excluded.is_active, tie_breaker = excluded.tie_breaker;

  insert into public.rounds (id, tournament_id, number, status, seed, started_at, ended_at)
  select (item->>'id')::uuid, tournament_id, (item->>'number')::integer, (item->>'status')::public.round_status, (item->>'seed')::bigint,
         nullif(item->>'startedAt', '')::timestamptz, nullif(item->>'endedAt', '')::timestamptz
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) item
  on conflict (id) do update set number = excluded.number, status = excluded.status, seed = excluded.seed, started_at = excluded.started_at, ended_at = excluded.ended_at;

  insert into public.pods (id, round_id, number, result_type, notes)
  select (pod->>'id')::uuid, (round->>'id')::uuid, (pod->>'number')::integer, nullif(pod->>'resultType', '')::public.result_type, nullif(pod->>'notes', '')
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  on conflict (id) do update set number = excluded.number, result_type = excluded.result_type, notes = excluded.notes;

  delete from public.pod_players pp
  where pp.pod_id in (
    select (pod->>'id')::uuid
    from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
    cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  );

  insert into public.pod_players (pod_id, player_id)
  select (pod->>'id')::uuid, player_id::uuid
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements_text(coalesce(pod->'playerIds', '[]'::jsonb)) player_id;

  delete from public.pod_results pr
  where pr.pod_id in (
    select (pod->>'id')::uuid
    from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
    cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  );

  insert into public.pod_results (pod_id, player_id, position, kills, is_dead)
  select (pod->>'id')::uuid, (result->>'playerId')::uuid, (result->>'position')::integer, (result->>'kills')::integer, coalesce((result->>'dead')::boolean, false)
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements(coalesce(pod->'results', '[]'::jsonb)) result;
end;
$$;

grant execute on function public.save_tournament_snapshot(jsonb) to authenticated;
