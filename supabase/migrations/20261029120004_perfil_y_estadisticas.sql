-- Perfil y estadísticas: fotos de perfil (storage) y estadísticas globales de jugador.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

SET check_function_bodies = false;

-- Funciones

CREATE FUNCTION public.get_my_player_statistics() RETURNS TABLE(tournaments_played integer, rounds_played integer, wins integer, losses integer, draws integer, points integer, kills integer, podiums integer)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
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
    finished_ranks as (
      select
        totals.tournament_id,
        totals.player_id,
        row_number() over (
          partition by totals.tournament_id
          order by totals.points desc, strength.value desc, totals.kills desc, totals.tie_breaker asc
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

CREATE FUNCTION public.hydrate_linked_player_avatar() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.profile_id is not null then
    select avatar_url into new.avatar_url from public.profiles where id = new.profile_id;
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.sync_linked_player_avatars() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  update public.players set avatar_url = new.avatar_url where profile_id = new.id;
  return new;
end;
$$;

-- Storage

-- Bucket público de fotos de perfil: una carpeta por cuenta.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-avatars', 'profile-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY "public profile avatar read" ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

CREATE POLICY "users manage their profile avatar" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'profile-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
