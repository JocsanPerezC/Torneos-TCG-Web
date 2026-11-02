-- Desempates de la clasificación: mismo orden que compareStandings (src/domain/scoring.ts).
-- Puntos, victorias, empates, menos derrotas, win rate, kills y promedio de puntos de los
-- rivales; quien empata en todo comparte el puesto (rank). Antes: puntos, suma de puntos de
-- los rivales, kills y orden de inscripción.
-- Victorias, derrotas y empates solo cuentan en mesas con resultado para todos sus jugadores,
-- igual que en la app.

CREATE OR REPLACE FUNCTION public.get_my_player_statistics() RETURNS TABLE(tournaments_played integer, rounds_played integer, wins integer, losses integer, draws integer, points integer, kills integer, podiums integer)
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
    linked_tournaments as (
      select distinct tournament_id from linked_entries
    ),
    complete_pods as (
      select pod.id as pod_id
      from public.pods pod
      join public.rounds round on round.id = pod.round_id
      join linked_tournaments linked on linked.tournament_id = round.tournament_id
      where (select count(*) from public.pod_players seat where seat.pod_id = pod.id)
        = (select count(*) from public.pod_results result
           where result.pod_id = pod.id and result.outcome is not null)
    ),
    all_totals as (
      select
        p.tournament_id,
        p.id as player_id,
        count(pr.pod_id)::integer as rounds_played,
        count(*) filter (where pr.outcome = 'win' and cp.pod_id is not null)::integer as wins,
        count(*) filter (where pr.outcome = 'loss' and cp.pod_id is not null)::integer as losses,
        count(*) filter (where pr.outcome = 'draw' and cp.pod_id is not null)::integer as draws,
        coalesce(sum(pr.points), 0)::integer as points,
        coalesce(sum(pr.kills), 0)::integer as kills
      from public.players p
      join linked_tournaments linked on linked.tournament_id = p.tournament_id
      left join public.pod_results pr on pr.player_id = p.id
      left join complete_pods cp on cp.pod_id = pr.pod_id
      group by p.tournament_id, p.id
    ),
    opponent_strength as (
      select
        own.tournament_id,
        own.player_id,
        coalesce(avg(opponent.points), 0) as value
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
    finished_ranks as (
      select
        totals.tournament_id,
        totals.player_id,
        rank() over (
          partition by totals.tournament_id
          order by
            totals.points desc,
            totals.wins desc,
            totals.draws desc,
            totals.losses asc,
            case when totals.wins + totals.losses + totals.draws > 0
              then (totals.wins + totals.draws * 0.5) / (totals.wins + totals.losses + totals.draws)
              else 0 end desc,
            totals.kills desc,
            strength.value desc
        ) as position
      from all_totals totals
      join public.tournaments tournament on tournament.id = totals.tournament_id
      join opponent_strength strength
        on strength.tournament_id = totals.tournament_id
        and strength.player_id = totals.player_id
      where tournament.status = 'finalizado'
        or (
          select count(*)
          from public.rounds round
          where round.tournament_id = tournament.id
            and round.status = 'completada'
        ) >= tournament.planned_rounds
    )
    select
      count(entry.player_id)::integer,
      coalesce(sum(totals.rounds_played), 0)::integer,
      coalesce(sum(totals.wins), 0)::integer,
      coalesce(sum(totals.losses), 0)::integer,
      coalesce(sum(totals.draws), 0)::integer,
      coalesce(sum(totals.points), 0)::integer,
      coalesce(sum(totals.kills), 0)::integer,
      (count(rank.position) filter (where rank.position <= 3))::integer
    from linked_entries entry
    left join all_totals totals
      on totals.tournament_id = entry.tournament_id
      and totals.player_id = entry.player_id
    left join finished_ranks rank
      on rank.tournament_id = entry.tournament_id
      and rank.player_id = entry.player_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.get_my_player_tournament_results() RETURNS TABLE(
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
    linked_tournaments as (
      select distinct tournament_id from linked_entries
    ),
    complete_pods as (
      select pod.id as pod_id
      from public.pods pod
      join public.rounds round on round.id = pod.round_id
      join linked_tournaments linked on linked.tournament_id = round.tournament_id
      where (select count(*) from public.pod_players seat where seat.pod_id = pod.id)
        = (select count(*) from public.pod_results result
           where result.pod_id = pod.id and result.outcome is not null)
    ),
    all_totals as (
      select
        p.tournament_id,
        p.id as player_id,
        count(pr.pod_id)::integer as rounds_played,
        count(*) filter (where pr.outcome = 'win' and cp.pod_id is not null)::integer as wins,
        count(*) filter (where pr.outcome = 'loss' and cp.pod_id is not null)::integer as losses,
        count(*) filter (where pr.outcome = 'draw' and cp.pod_id is not null)::integer as draws,
        coalesce(sum(pr.points), 0)::integer as points,
        coalesce(sum(pr.kills), 0)::integer as kills
      from public.players p
      join linked_tournaments linked on linked.tournament_id = p.tournament_id
      left join public.pod_results pr on pr.player_id = p.id
      left join complete_pods cp on cp.pod_id = pr.pod_id
      group by p.tournament_id, p.id
    ),
    opponent_strength as (
      select
        own.tournament_id,
        own.player_id,
        coalesce(avg(opponent.points), 0) as value
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
        (rank() over (
          partition by totals.tournament_id
          order by
            totals.points desc,
            totals.wins desc,
            totals.draws desc,
            totals.losses asc,
            case when totals.wins + totals.losses + totals.draws > 0
              then (totals.wins + totals.draws * 0.5) / (totals.wins + totals.losses + totals.draws)
              else 0 end desc,
            totals.kills desc,
            strength.value desc
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
