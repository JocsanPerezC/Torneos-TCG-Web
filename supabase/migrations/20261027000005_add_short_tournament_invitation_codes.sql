-- Keep the QR/link token long and opaque. The short code is a separate,
-- easy-to-share identifier for players who enter an invitation manually.
alter table public.tournament_join_links
  add column if not exists code text;

create unique index if not exists tournament_join_links_code_key
  on public.tournament_join_links (code);

create or replace function public.generate_tournament_join_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
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

revoke all on function public.generate_tournament_join_code() from public;

do $$
declare
  invitation record;
  next_code text;
  attempts integer;
begin
  for invitation in
    select tournament_id from public.tournament_join_links where code is null
  loop
    attempts := 0;
    loop
      next_code := public.generate_tournament_join_code();
      begin
        update public.tournament_join_links
        set code = next_code
        where tournament_id = invitation.tournament_id;
        exit;
      exception
        when unique_violation then
          attempts := attempts + 1;
          if attempts >= 10 then
            raise exception 'Could not generate a unique tournament invitation code';
          end if;
      end;
    end loop;
  end loop;
end;
$$;

alter table public.tournament_join_links
  alter column code set not null;

create or replace function public.create_or_rotate_tournament_join_link(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
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

create or replace function public.get_tournament_join_code(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
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

create or replace function public.get_joinable_tournament(p_token text)
returns table (
  tournament_id uuid,
  name text,
  format text,
  available_slots integer
)
language sql
stable
security definer
set search_path = public
as $$
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

create or replace function public.join_tournament(p_token text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
  ) then
    raise exception 'This player name is already registered in the tournament';
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

revoke all on function public.get_tournament_join_code(uuid) from public;
grant execute on function public.get_tournament_join_code(uuid) to authenticated;
