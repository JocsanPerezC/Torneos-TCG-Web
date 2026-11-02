-- Tiempos de victoria del jugador para "Mis estadísticas": cuántas victorias tienen tiempo
-- registrado, su duración promedio y la más rápida (en segundos, desde el inicio de la ronda).
-- Solo cuentan mesas con resultado para todos sus jugadores, igual que la clasificación.

CREATE FUNCTION public.get_my_player_win_times() RETURNS TABLE(
    timed_wins integer,
    average_win_seconds integer,
    fastest_win_seconds integer
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
    with timed_wins as (
      select extract(epoch from (table_pod.finished_at - table_round.started_at)) as seconds
      from public.players player
      join public.pod_results result
        on result.player_id = player.id and result.outcome = 'win'
      join public.pods table_pod on table_pod.id = result.pod_id
      join public.rounds table_round on table_round.id = table_pod.round_id
      where player.profile_id = auth.uid()
        and table_pod.finished_at is not null
        and table_round.started_at is not null
        and table_pod.finished_at >= table_round.started_at
        and (select count(*) from public.pod_players seat where seat.pod_id = table_pod.id)
          = (select count(*) from public.pod_results other
             where other.pod_id = table_pod.id and other.outcome is not null)
    )
    select
      count(*)::integer,
      round(avg(seconds))::integer,
      round(min(seconds))::integer
    from timed_wins;
end;
$$;

REVOKE ALL ON FUNCTION public.get_my_player_win_times() FROM PUBLIC;
GRANT ALL ON FUNCTION public.get_my_player_win_times() TO authenticated, service_role;
