-- Mazo por torneo (opcional): el jugador elige uno de sus mazos para un torneo en el que está
-- inscrito. Se guarda una "foto" del mazo en la inscripción (nombre, enlace, comandante, arte y
-- colores) para que el historial no cambie si después edita o borra el mazo. Se puede elegir o
-- cambiar hasta que empieza la primera ronda.

ALTER TABLE public.players
    ADD COLUMN deck_id uuid REFERENCES public.decks(id) ON DELETE SET NULL,
    ADD COLUMN deck_name text,
    ADD COLUMN deck_url text,
    ADD COLUMN deck_commander text,
    ADD COLUMN deck_commander_image text,
    ADD COLUMN deck_colors text DEFAULT '' NOT NULL,
    ADD CONSTRAINT players_deck_colors CHECK (deck_colors ~ '^[WUBRG]{0,5}$');

-- ¿Ya empezó el torneo? Desde la primera ronda iniciada, el mazo queda fijo.
CREATE FUNCTION public.tournament_deck_locked(p_tournament_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.tournaments t
    where t.id = p_tournament_id and t.status = 'finalizado'
  ) or exists (
    select 1 from public.rounds r
    where r.tournament_id = p_tournament_id
      and (r.status <> 'borrador' or r.started_at is not null)
  );
$$;

-- Elige (p_deck_id) o quita (null) el mazo de la propia inscripción.
CREATE FUNCTION public.set_my_tournament_deck(p_tournament_id uuid, p_deck_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  entry_id uuid;
  chosen public.decks%rowtype;
begin
  select id into entry_id
  from public.players
  where tournament_id = p_tournament_id and profile_id = auth.uid();
  if entry_id is null then
    raise exception 'You are not registered in this tournament';
  end if;

  if public.tournament_deck_locked(p_tournament_id) then
    raise exception 'The deck can no longer be changed: the tournament has already started';
  end if;

  if p_deck_id is null then
    update public.players
    set deck_id = null, deck_name = null, deck_url = null, deck_commander = null,
        deck_commander_image = null, deck_colors = ''
    where id = entry_id;
    return;
  end if;

  select * into chosen from public.decks where id = p_deck_id and profile_id = auth.uid();
  if chosen.id is null then
    raise exception 'Deck not found';
  end if;

  update public.players
  set deck_id = chosen.id,
      deck_name = chosen.name,
      deck_url = chosen.url,
      deck_commander = chosen.commander_name,
      deck_commander_image = chosen.commander_image,
      deck_colors = chosen.color_identity
  where id = entry_id;
end;
$$;

REVOKE ALL ON FUNCTION public.tournament_deck_locked(uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.tournament_deck_locked(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_my_tournament_deck(uuid, uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_my_tournament_deck(uuid, uuid) TO authenticated, service_role;

-- "Mis torneos": el mazo elegido en cada inscripción y si todavía se puede cambiar.
DROP FUNCTION public.get_my_player_tournaments();

CREATE FUNCTION public.get_my_player_tournaments() RETURNS TABLE(tournament_id uuid, name text, format text, status public.tournament_status, public_slug text, planned_rounds integer, round_count integer, participant_name text, created_at timestamp with time zone, completed_round_count integer, deck_id uuid, deck_name text, deck_commander text, deck_commander_image text, deck_colors text, deck_locked boolean)
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
      (count(r.id) filter (where r.status = 'completada'))::integer,
      p.deck_id,
      p.deck_name,
      p.deck_commander,
      p.deck_commander_image,
      p.deck_colors,
      public.tournament_deck_locked(t.id)
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

-- Vista pública: cada jugador incluye su mazo (sin el id interno).
CREATE OR REPLACE FUNCTION public.get_public_tournament(slug text) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'information', t.information, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker,
      'avatarUrl', p.avatar_url,
      'deck', case when p.deck_name is null then null else jsonb_build_object(
        'name', p.deck_name, 'url', p.deck_url, 'commander', p.deck_commander,
        'commanderImage', p.deck_commander_image, 'colors', p.deck_colors
      ) end
    ) order by p.name) from players p where p.tournament_id = t.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'finishedAt', po.finished_at, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id = po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id = po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id = r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id = t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug = slug and t.is_public = true;
$$;
