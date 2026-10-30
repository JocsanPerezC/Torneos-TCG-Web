-- Apodo de jugador: el nombre de la cuenta queda privado y el apodo (único, sin
-- distinguir mayúsculas) es lo que se muestra en torneos y clasificaciones.

ALTER TABLE public.profiles ADD COLUMN nickname text;

-- Devuelve un apodo libre a partir de una base: limpia espacios, recorta y, si
-- ya existe, agrega un número (Jocsan, Jocsan2, Jocsan3…).
CREATE FUNCTION public.available_nickname(base text, exclude_id uuid DEFAULT NULL) RETURNS text
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  clean text := left(regexp_replace(trim(coalesce(base, '')), '\s+', ' ', 'g'), 24);
  candidate text;
  suffix integer := 1;
begin
  if length(clean) < 2 then
    clean := 'Jugador';
  end if;
  candidate := clean;
  while exists (
    select 1 from public.profiles
    where lower(nickname) = lower(candidate)
      and id is distinct from exclude_id
  ) loop
    suffix := suffix + 1;
    candidate := clean || suffix;
  end loop;
  return candidate;
end;
$$;

-- Cuentas existentes: su apodo inicial es su nombre actual, para que nada cambie
-- en los torneos hasta que lo editen.
DO $$
declare
  profile record;
begin
  for profile in select id, display_name from public.profiles order by created_at, id loop
    update public.profiles
    set nickname = public.available_nickname(profile.display_name, profile.id)
    where id = profile.id;
  end loop;
end;
$$;

ALTER TABLE public.profiles
    ALTER COLUMN nickname SET NOT NULL,
    ADD CONSTRAINT profiles_nickname_length CHECK (char_length(trim(nickname)) BETWEEN 2 AND 30);

CREATE UNIQUE INDEX profiles_nickname_key ON public.profiles USING btree (lower(nickname));

-- Para validar el apodo en el registro y en el perfil antes de guardarlo.
CREATE FUNCTION public.is_nickname_available(candidate text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select not exists (
    select 1 from public.profiles
    where lower(nickname) = lower(trim(candidate))
      and id is distinct from auth.uid()
  );
$$;

-- Registro: usa el apodo elegido; con Google, el primer nombre de la cuenta.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  account_name text := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (
    id, display_name, nickname, auth_provider, role, role_locked, terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version, legal_consent_required
  )
  values (
    new.id,
    account_name,
    public.available_nickname(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
        split_part(trim(account_name), ' ', 1)
      ),
      new.id
    ),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end,
    'organizer'::public.app_role,
    false,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then now() end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then '2026-09-22' end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then now() end,
    case when coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') = 'true' then '2026-09-22' end,
    coalesce(new.raw_user_meta_data ->> 'legal_consent', 'false') <> 'true'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Los participantes vinculados a una cuenta muestran su apodo.
CREATE OR REPLACE FUNCTION public.hydrate_linked_player_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.profile_id is not null then
    select coalesce(nullif(trim(nickname), ''), new.name), avatar_url
    into new.name, new.avatar_url
    from public.profiles
    where id = new.profile_id;
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.sync_linked_player_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  perform set_config('app.sync_linked_profile', 'true', true);
  update public.players
  set name = new.nickname,
      avatar_url = new.avatar_url
  where profile_id = new.id
    and (name is distinct from new.nickname or avatar_url is distinct from new.avatar_url);
  return new;
end;
$$;

DROP TRIGGER profiles_sync_linked_profile ON public.profiles;
CREATE TRIGGER profiles_sync_linked_profile AFTER UPDATE OF nickname, avatar_url ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.sync_linked_player_profile();

-- Alinea los participantes vinculados que ya existen con su apodo.
DO $$
begin
  perform set_config('app.sync_linked_profile', 'true', true);
  update public.players player
  set name = profile.nickname
  from public.profiles profile
  where player.profile_id = profile.id
    and player.name is distinct from profile.nickname;
end;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.available_nickname(text, uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION public.available_nickname(text, uuid) TO service_role;
REVOKE ALL ON FUNCTION public.is_nickname_available(text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_nickname_available(text) TO anon, authenticated, service_role;
GRANT UPDATE(nickname) ON TABLE public.profiles TO authenticated;
