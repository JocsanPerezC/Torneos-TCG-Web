-- Invitaciones y jugadores con cuenta: enlaces, códigos, inscripción y sincronización de nombres.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

SET check_function_bodies = false;

-- Funciones

CREATE FUNCTION public.create_or_rotate_tournament_join_link(p_tournament_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  next_token text;
  next_code text;
  attempts integer := 0;
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  loop
    next_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    next_code := public.generate_tournament_join_code();

    begin
      insert into public.tournament_join_links (tournament_id, token, code, revoked_at)
      values (p_tournament_id, next_token, next_code, null)
      on conflict (tournament_id) do update
        set token = excluded.token,
            code = excluded.code,
            created_at = now(),
            revoked_at = null;

      return next_token;
    exception
      when unique_violation then
        attempts := attempts + 1;
        if attempts >= 10 then
          raise exception 'Could not generate a unique tournament invitation';
        end if;
    end;
  end loop;
end;
$$;

CREATE FUNCTION public.enforce_player_profile_link() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.profile_id is not null then
    if new.profile_id <> auth.uid() then
      raise exception 'A participant can only be linked by its own account';
    end if;
    if not exists (
      select 1
      from public.profiles
      where id = new.profile_id
        and role_locked
        and role::text = 'player'
    ) then
      raise exception 'Only player accounts can be linked to a participant';
    end if;
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.enforce_resolved_participant_names() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if exists (
    select 1
    from public.players manual_player
    join public.players account_player
      on account_player.tournament_id = manual_player.tournament_id
     and account_player.normalized_name = manual_player.normalized_name
     and account_player.profile_id is not null
    where manual_player.tournament_id = new.tournament_id
      and manual_player.profile_id is null
  ) then
    raise exception 'Rename the manual participant with the duplicate name before generating a round';
  end if;

  return new;
end;
$$;

CREATE FUNCTION public.generate_tournament_join_code() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
  random_bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  next_code text := '';
  byte_index integer;
begin
  for byte_index in 0..5 loop
    next_code := next_code || substr(
      alphabet,
      (get_byte(random_bytes, byte_index) % length(alphabet)) + 1,
      1
    );
  end loop;

  return next_code;
end;
$$;

CREATE FUNCTION public.get_joinable_tournament(p_token text) RETURNS TABLE(tournament_id uuid, name text, format text, available_slots integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select
    t.id,
    t.name,
    t.format,
    greatest(0, t.max_players - count(p.id)::integer)
  from public.tournament_join_links link
  join public.tournaments t on t.id = link.tournament_id
  left join public.players p on p.tournament_id = t.id
  where (link.token = lower(p_token) or link.code = upper(p_token))
    and link.revoked_at is null
    and t.status = 'activo'
  group by t.id, t.name, t.format, t.max_players;
$$;

CREATE FUNCTION public.get_my_player_tournaments() RETURNS TABLE(tournament_id uuid, name text, format text, status public.tournament_status, public_slug text, planned_rounds integer, round_count integer, participant_name text, created_at timestamp with time zone)
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
      t.created_at
    from public.players p
    join public.tournaments t on t.id = p.tournament_id
    left join public.rounds r on r.tournament_id = t.id
    where p.profile_id = auth.uid()
    group by t.id, p.id
    order by t.status = 'activo' desc, t.created_at desc;
end;
$$;

CREATE FUNCTION public.get_tournament_join_code(p_tournament_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  current_code text;
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  select code into current_code
  from public.tournament_join_links
  where tournament_id = p_tournament_id and revoked_at is null;

  return current_code;
end;
$$;

CREATE FUNCTION public.get_tournament_join_link(p_tournament_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  current_token text;
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  select token into current_token
  from public.tournament_join_links
  where tournament_id = p_tournament_id and revoked_at is null;

  return current_token;
end;
$$;

CREATE FUNCTION public.hydrate_linked_player_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.profile_id is not null then
    select
      coalesce(nullif(trim(display_name), ''), new.name),
      avatar_url
    into new.name, new.avatar_url
    from public.profiles
    where id = new.profile_id;
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.join_tournament(p_token text, p_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  tournament_record public.tournaments%rowtype;
  participant_id uuid;
  display_name text := trim(p_name);
  next_tie_breaker integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'player'
  ) then
    raise exception 'Only player accounts can join a tournament';
  end if;

  select t.* into tournament_record
  from public.tournament_join_links link
  join public.tournaments t on t.id = link.tournament_id
  where (link.token = lower(p_token) or link.code = upper(p_token))
    and link.revoked_at is null
    and t.status = 'activo'
  for update of t;

  if not found then
    raise exception 'This invitation is unavailable';
  end if;

  select id into participant_id
  from public.players
  where tournament_id = tournament_record.id and profile_id = auth.uid();

  if participant_id is not null then
    return jsonb_build_object('tournamentId', tournament_record.id, 'playerId', participant_id);
  end if;

  if (select count(*) from public.players where tournament_id = tournament_record.id) >= tournament_record.max_players then
    raise exception 'This tournament is full';
  end if;

  if display_name = '' then
    raise exception 'A player name is required';
  end if;

  if exists (
    select 1
    from public.players
    where tournament_id = tournament_record.id
      and normalized_name = lower(display_name)
      and profile_id is not null
  ) then
    raise exception 'A linked player account already uses this name in the tournament';
  end if;

  select coalesce(max(tie_breaker), 0) + 1 into next_tie_breaker
  from public.players
  where tournament_id = tournament_record.id;

  insert into public.players (tournament_id, name, is_active, tie_breaker, profile_id)
  values (tournament_record.id, display_name, true, next_tie_breaker, auth.uid())
  returning id into participant_id;

  return jsonb_build_object('tournamentId', tournament_record.id, 'playerId', participant_id);
end;
$$;

CREATE FUNCTION public.reject_linked_player_name_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if old.profile_id is not null
    and new.name is distinct from old.name
    and coalesce(current_setting('app.sync_linked_profile', true), '') <> 'true' then
    raise exception 'Linked participant names are managed by the player profile';
  end if;
  return new;
end;
$$;

CREATE FUNCTION public.revoke_tournament_join_link(p_tournament_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  update public.tournament_join_links
  set revoked_at = now()
  where tournament_id = p_tournament_id and revoked_at is null;
end;
$$;

CREATE FUNCTION public.sync_linked_player_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  perform set_config('app.sync_linked_profile', 'true', true);
  update public.players
  set name = coalesce(new.display_name, old.display_name, name),
      avatar_url = new.avatar_url
  where profile_id = new.id
    and (
      name is distinct from coalesce(new.display_name, old.display_name, name)
      or avatar_url is distinct from new.avatar_url
    );
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

-- Triggers

CREATE TRIGGER players_hydrate_linked_profile BEFORE INSERT OR UPDATE OF profile_id ON public.players FOR EACH ROW EXECUTE FUNCTION public.hydrate_linked_player_profile();

CREATE TRIGGER players_reject_linked_name_updates BEFORE UPDATE OF name ON public.players FOR EACH ROW EXECUTE FUNCTION public.reject_linked_player_name_update();

CREATE TRIGGER players_require_player_profile BEFORE INSERT OR UPDATE OF profile_id ON public.players FOR EACH ROW EXECUTE FUNCTION public.enforce_player_profile_link();

CREATE TRIGGER profiles_sync_linked_profile AFTER UPDATE OF display_name, avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_linked_player_profile();

CREATE TRIGGER rounds_require_resolved_participant_names BEFORE INSERT ON public.rounds FOR EACH ROW EXECUTE FUNCTION public.enforce_resolved_participant_names();
