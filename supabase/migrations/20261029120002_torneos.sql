-- Torneos: guardado atómico, borrado, límites, vencimiento de rondas y vista pública.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

SET check_function_bodies = false;

-- Funciones

CREATE FUNCTION public.complete_expired_rounds() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  completed_count integer;
begin
  with expired_rounds as (
    update public.rounds
    set status = 'completada',
        ended_at = started_at + interval '48 hours'
    where status = 'activa'
      and started_at <= now() - interval '48 hours'
    returning id
  ), completed_results as (
    insert into public.pod_results (pod_id, player_id, position, kills, is_dead, points, outcome)
    select pod.id, pod_player.player_id, null, 0, false, 1, 'draw'::public.pod_result_outcome
    from expired_rounds round
    join public.pods pod on pod.round_id = round.id
    join public.pod_players pod_player on pod_player.pod_id = pod.id
    on conflict (pod_id, player_id) do update
    set position = null,
        kills = 0,
        is_dead = false,
        points = 1,
        outcome = 'draw'::public.pod_result_outcome
    returning pod_id
  )
  select count(*) into completed_count from expired_rounds;

  return completed_count;
end;
$$;

CREATE FUNCTION public.delete_tournament(tournament_id uuid) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_tournament_owner(tournament_id) then
    raise exception 'Not authorized to delete this tournament';
  end if;

  delete from public.pod_results pr
  using public.pods po, public.rounds r
  where pr.pod_id = po.id
    and po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.pod_players pp
  using public.pods po, public.rounds r
  where pp.pod_id = po.id
    and po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.pods po
  using public.rounds r
  where po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.rounds r
  where r.tournament_id = delete_tournament.tournament_id;

  delete from public.scoring_rules sr
  where sr.tournament_id = delete_tournament.tournament_id;

  delete from public.players p
  where p.tournament_id = delete_tournament.tournament_id;

  delete from public.tournaments t
  where t.id = delete_tournament.tournament_id;
end;
$$;

CREATE FUNCTION public.enforce_expired_round_completion() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.status = 'activa'
    and new.started_at <= now() - interval '48 hours' then
    perform public.complete_expired_rounds();
  end if;

  return null;
end;
$$;

CREATE FUNCTION public.enforce_tournament_limit() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- Serializing per profile prevents concurrent inserts from exceeding the limit.
  perform 1 from public.profiles where id = new.owner_id for update;

  if (select count(*) from public.tournaments where owner_id = new.owner_id) >= 10 then
    raise exception 'Solo puedes tener un máximo de 10 torneos.' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

CREATE FUNCTION public.get_public_tournament(slug text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'information', t.information, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker,
      'avatarUrl', p.avatar_url
    ) order by p.name) from players p where p.tournament_id = t.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id = po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id = po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id = r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id = t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug = slug and t.is_public = true;
$$;

CREATE FUNCTION public.is_tournament_owner(tid uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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

CREATE FUNCTION public.prevent_duplicate_round_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if exists (select 1 from public.pod_players pp join public.pods other_pod on other_pod.id=pp.pod_id join public.pods new_pod on new_pod.id=new.pod_id where pp.player_id=new.player_id and other_pod.round_id=new_pod.round_id and pp.pod_id<>new.pod_id) then
    raise exception 'A player may only be assigned once per round';
  end if;
  return new;
end $$;

CREATE FUNCTION public.save_tournament_snapshot(snapshot jsonb) RETURNS void
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

-- Triggers

CREATE CONSTRAINT TRIGGER enforce_expired_round_completion AFTER INSERT OR UPDATE OF status, started_at ON public.rounds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.enforce_expired_round_completion();

CREATE TRIGGER pod_player_once_per_round BEFORE INSERT OR UPDATE ON public.pod_players FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_round_assignment();

CREATE TRIGGER tournament_limit_before_insert BEFORE INSERT ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.enforce_tournament_limit();

-- Vistas

CREATE VIEW public.published_tournament_snapshot WITH (security_invoker='true') AS
 SELECT t.id,
    t.name,
    t.format,
    t.public_slug,
    t.status,
    r.number AS round_number,
    r.status AS round_status
   FROM (public.tournaments t
     LEFT JOIN public.rounds r ON ((r.tournament_id = t.id)))
  WHERE t.is_public;

-- Tareas programadas

-- Cierra cada 5 minutos las rondas vencidas.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'complete-expired-rounds';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'complete-expired-rounds',
    '*/5 * * * *',
    'select public.complete_expired_rounds()'
  );
END;
$$;
