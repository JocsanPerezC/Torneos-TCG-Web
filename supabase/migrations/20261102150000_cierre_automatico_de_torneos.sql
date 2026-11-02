-- Cierre automático de torneos y corrección del cierre de rondas vencidas.

-- 1) Rondas vencidas (más de 48 horas activas): antes reemplazaba TODOS los resultados de la
--    ronda por un empate con 1 punto, incluso los que el organizador ya había guardado.
--    Ahora solo completa los asientos sin resultado y respeta lo guardado.
CREATE OR REPLACE FUNCTION public.complete_expired_rounds() RETURNS integer
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
    on conflict (pod_id, player_id) do nothing
    returning pod_id
  )
  select count(*) into completed_count from expired_rounds;

  return completed_count;
end;
$$;

-- 2) Torneos olvidados: se finalizan solos cuando
--    a) ya completaron todas sus rondas planificadas, no tienen rondas activas y pasaron
--       24 horas desde que terminó la última; o
--    b) llevan 30 días sin actividad (ni rondas nuevas, ni inicios, ni cierres).
CREATE FUNCTION public.finalize_idle_tournaments() RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  finalized_count integer;
begin
  with activity as (
    select
      tournament.id,
      tournament.planned_rounds,
      count(round.id) filter (where round.status = 'completada') as completed_rounds,
      count(round.id) filter (where round.status = 'activa') as active_rounds,
      max(round.ended_at) as last_round_end,
      greatest(
        tournament.created_at,
        max(round.started_at),
        max(round.ended_at)
      ) as last_activity
    from public.tournaments tournament
    left join public.rounds round on round.tournament_id = tournament.id
    where tournament.status <> 'finalizado'
    group by tournament.id, tournament.planned_rounds, tournament.created_at
  ), finalized as (
    update public.tournaments tournament
    set status = 'finalizado'
    from activity
    where tournament.id = activity.id
      and (
        (
          activity.completed_rounds >= activity.planned_rounds
          and activity.active_rounds = 0
          and activity.last_round_end <= now() - interval '24 hours'
        )
        or activity.last_activity <= now() - interval '30 days'
      )
    returning tournament.id
  )
  select count(*) into finalized_count from finalized;

  return finalized_count;
end;
$$;

REVOKE ALL ON FUNCTION public.finalize_idle_tournaments() FROM PUBLIC;
GRANT ALL ON FUNCTION public.finalize_idle_tournaments() TO service_role;

-- Se revisa cada hora.
DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'finalize-idle-tournaments';

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'finalize-idle-tournaments',
    '0 * * * *',
    'select public.finalize_idle_tournaments()'
  );
END;
$$;

-- 3) "Mis torneos" del jugador: además de cuántas rondas hay, cuántas están completadas, para
--    distinguir un torneo que solo espera su cierre de uno que todavía se está jugando.
--    Cambia el tipo de retorno, por eso se elimina y se vuelve a crear.
DROP FUNCTION public.get_my_player_tournaments();

CREATE FUNCTION public.get_my_player_tournaments() RETURNS TABLE(tournament_id uuid, name text, format text, status public.tournament_status, public_slug text, planned_rounds integer, round_count integer, participant_name text, created_at timestamp with time zone, completed_round_count integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
      t.created_at,
      (count(r.id) filter (where r.status = 'completada'))::integer
    from public.players p
    join public.tournaments t on t.id = p.tournament_id
    left join public.rounds r on r.tournament_id = t.id
    where p.profile_id = auth.uid()
    group by t.id, p.id
    order by t.status = 'activo' desc, t.created_at desc;
end;
$$;

REVOKE ALL ON FUNCTION public.get_my_player_tournaments() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_player_tournaments() TO anon, authenticated, service_role;
