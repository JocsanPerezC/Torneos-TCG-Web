-- Store the score awarded to each player directly on their table result.
-- Existing results are converted once using the rules that produced them.
alter table public.pod_results
  add column if not exists points integer;

alter table public.tournaments
  add column if not exists max_players integer not null default 32 check (max_players between 3 and 50),
  add column if not exists max_tables integer not null default 8 check (max_tables between 1 and 25);

update public.pod_results pr
set points = case
  when po.result_type = 'empate' then case when pr.is_dead then 0 else sr.tie_points end
  when (select count(*) from public.pod_players pp where pp.pod_id = pr.pod_id) = 5 then
    case pr.position when 1 then 5 when 2 then 4 when 3 then 3 when 4 then 2 when 5 then 1 else 0 end
  else case pr.position
    when 1 then sr.first_place
    when 2 then sr.second_place
    when 3 then sr.third_place
    when 4 then sr.fourth_place
    else 0
  end
end
from public.pods po
join public.rounds r on r.id = po.round_id
join public.scoring_rules sr on sr.tournament_id = r.tournament_id
where po.id = pr.pod_id
  and pr.points is null;

-- Results created by the current application always carry their own score.
alter table public.pod_results
  drop constraint if exists pod_results_points_nonnegative;

alter table public.pod_results
  alter column points set not null,
  add constraint pod_results_points_nonnegative check (points >= 0),
  alter column position drop not null;

-- The atomic snapshot is the normal persistence path used by the application.
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
      status = (snapshot->>'status')::public.tournament_status, is_public = coalesce((snapshot->>'isPublic')::boolean, true),
      max_players = coalesce((snapshot->>'maxPlayers')::integer, 32), max_tables = coalesce((snapshot->>'maxTables')::integer, 8)
  where id = tournament_id;

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

  insert into public.pods (id, round_id, number, notes)
  select (pod->>'id')::uuid, (round->>'id')::uuid, (pod->>'number')::integer, nullif(pod->>'notes', '')
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  on conflict (id) do update set number = excluded.number, notes = excluded.notes;

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

  insert into public.pod_results (pod_id, player_id, points, kills)
  select (pod->>'id')::uuid, (result->>'playerId')::uuid, (result->>'points')::integer, (result->>'kills')::integer
  from jsonb_array_elements(coalesce(snapshot->'rounds', '[]'::jsonb)) round
  cross join lateral jsonb_array_elements(coalesce(round->'pods', '[]'::jsonb)) pod
  cross join lateral jsonb_array_elements(coalesce(pod->'results', '[]'::jsonb)) result;
end;
$$;
