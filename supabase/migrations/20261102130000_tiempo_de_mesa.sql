-- Tiempo de mesa: momento en que una mesa quedó con todos sus resultados. La app lo registra
-- al guardar la mesa por primera vez con resultados completos y el organizador puede corregirlo.
-- La duración de la partida es finished_at menos rounds.started_at.

ALTER TABLE public.pods ADD COLUMN finished_at timestamp with time zone;

-- La vista pública incluye el momento en que terminó cada mesa (finishedAt).
CREATE OR REPLACE FUNCTION public.get_public_tournament(slug text) RETURNS jsonb
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
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'finishedAt', po.finished_at, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id = po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id = po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id = r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id = t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug = slug and t.is_public = true;
$$;
