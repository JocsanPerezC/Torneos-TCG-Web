-- Auth owns emails/password hashes in auth.users. Public profiles only hold application data.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Read-only, scoped snapshot for a published tournament. It bypasses RLS only
-- after confirming publication, and never exposes owner identifiers or auth data.
create or replace function public.get_public_tournament(slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'players', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker) order by p.name) from players p where p.tournament_id=t.id), '[]'::jsonb),
    'scoring', coalesce((select jsonb_build_object('first', s.first_place, 'second', s.second_place, 'third', s.third_place, 'fourth', s.fourth_place, 'comboWinner', s.combo_winner, 'comboOther', s.combo_other) from scoring_rules s where s.tournament_id=t.id), '{}'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id=po.id), '[]'::jsonb), 'resultType', po.result_type, 'notes', po.notes, 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'position', pr.position, 'kills', pr.kills) order by pr.position) from pod_results pr where pr.pod_id=po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id=r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id=t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug=slug and t.is_public=true;
$$;
grant execute on function public.get_public_tournament(text) to anon, authenticated;
