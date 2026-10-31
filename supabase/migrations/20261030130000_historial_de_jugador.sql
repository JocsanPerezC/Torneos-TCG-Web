-- Historial de jugador: resultados por torneo (con posición) y forma reciente,
-- para la pantalla "Mis estadísticas". Usa el mismo criterio de clasificación
-- que get_my_player_statistics: puntos, fuerza de rivales, kills y desempate.

CREATE FUNCTION public.get_my_player_tournament_results() RETURNS TABLE(
    tournament_id uuid,
    name text,
    format text,
    public_slug text,
    created_at timestamp with time zone,
    player_count integer,
    "position" integer,
    is_final boolean,
    rounds_played integer,
    wins integer,
    losses integer,
    draws integer,
    points integer,
    kills integer
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'player'
  ) then
    raise exception 'Only player accounts can view player statistics';
  end if;

  return query
    with linked_entries as (
      select p.id as player_id, p.tournament_id
      from public.players p
      where p.profile_id = auth.uid()
    ),
    all_totals as (
      select
        p.tournament_id,
        p.id as player_id,
        p.tie_breaker,
        count(pr.pod_id)::integer as rounds_played,
        count(*) filter (where pr.outcome = 'win')::integer as wins,
        count(*) filter (where pr.outcome = 'loss')::integer as losses,
        count(*) filter (where pr.outcome = 'draw')::integer as draws,
        coalesce(sum(pr.points), 0)::integer as points,
        coalesce(sum(pr.kills), 0)::integer as kills
      from public.players p
      join (select distinct tournament_id from linked_entries) linked on linked.tournament_id = p.tournament_id
      left join public.pod_results pr on pr.player_id = p.id
      group by p.tournament_id, p.id, p.tie_breaker
    ),
    opponent_strength as (
      select
        own.tournament_id,
        own.player_id,
        coalesce(sum(opponent.points), 0)::integer as value
      from all_totals own
      left join public.pod_results own_result on own_result.player_id = own.player_id
      left join public.pod_results opponent_result
        on opponent_result.pod_id = own_result.pod_id
        and opponent_result.player_id <> own.player_id
      left join all_totals opponent
        on opponent.tournament_id = own.tournament_id
        and opponent.player_id = opponent_result.player_id
      group by own.tournament_id, own.player_id
    ),
    ranks as (
      select
        totals.tournament_id,
        totals.player_id,
        (row_number() over (
          partition by totals.tournament_id
          order by totals.points desc, strength.value desc, totals.kills desc, totals.tie_breaker asc
        ))::integer as position,
        (count(*) over (partition by totals.tournament_id))::integer as player_count
      from all_totals totals
      join opponent_strength strength
        on strength.tournament_id = totals.tournament_id
        and strength.player_id = totals.player_id
    )
    select
      tournament.id,
      tournament.name,
      tournament.format,
      tournament.public_slug,
      tournament.created_at,
      rank.player_count,
      rank.position,
      (
        tournament.status = 'finalizado'
        or (
          select count(*)
          from public.rounds round
          where round.tournament_id = tournament.id
            and round.status = 'completada'
        ) >= tournament.planned_rounds
      ),
      totals.rounds_played,
      totals.wins,
      totals.losses,
      totals.draws,
      totals.points,
      totals.kills
    from linked_entries entry
    join public.tournaments tournament on tournament.id = entry.tournament_id
    join all_totals totals
      on totals.tournament_id = entry.tournament_id
      and totals.player_id = entry.player_id
    join ranks rank
      on rank.tournament_id = entry.tournament_id
      and rank.player_id = entry.player_id
    order by tournament.created_at desc;
end;
$$;

-- Últimos resultados registrados de la cuenta, del más reciente al más antiguo.
CREATE FUNCTION public.get_my_recent_results(p_limit integer DEFAULT 5) RETURNS TABLE(
    tournament_name text,
    round_number integer,
    outcome text,
    points integer,
    kills integer
)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
#variable_conflict use_column
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'player'
  ) then
    raise exception 'Only player accounts can view player statistics';
  end if;

  return query
    select
      tournament.name,
      round.number,
      result.outcome::text,
      result.points,
      result.kills
    from public.players player
    join public.pod_results result on result.player_id = player.id
    join public.pods pod on pod.id = result.pod_id
    join public.rounds round on round.id = pod.round_id
    join public.tournaments tournament on tournament.id = round.tournament_id
    where player.profile_id = auth.uid()
      and result.outcome is not null
    order by coalesce(round.ended_at, round.started_at, tournament.created_at) desc, round.number desc
    limit least(greatest(coalesce(p_limit, 5), 1), 20);
end;
$$;

REVOKE ALL ON FUNCTION public.get_my_player_tournament_results() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_player_tournament_results() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_my_recent_results(integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_recent_results(integer) TO authenticated, service_role;
