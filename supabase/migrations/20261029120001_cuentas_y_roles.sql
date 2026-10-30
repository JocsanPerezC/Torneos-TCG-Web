-- Cuentas y roles: perfiles, roles, elección de rol, consentimiento legal y accesos.
--
-- Consolidación de las 40 migraciones originales (2026-09-13 a 2026-10-29) en su estado final.
-- Ver docs/decisions/0004-consolidacion-de-migraciones.md.

SET check_function_bodies = false;

-- Funciones

CREATE FUNCTION public.complete_google_signup_role(next_role public.app_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if next_role::text not in ('player', 'organizer') then
    raise exception 'Invalid signup role';
  end if;

  update public.profiles
  set role = next_role, role_locked = true
  where id = auth.uid() and role_locked = false;

  if not found then
    raise exception 'The account role is already assigned';
  end if;
end;
$$;

CREATE FUNCTION public.complete_signup_role(next_role public.app_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if next_role::text not in ('player', 'organizer') then
    raise exception 'Invalid signup role';
  end if;

  update public.profiles
  set role = next_role, role_locked = true
  where id = auth.uid() and role_locked = false;

  if not found then
    raise exception 'The account role is already assigned';
  end if;
end;
$$;

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (
    id, display_name, auth_provider, role, role_locked, terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version, legal_consent_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
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

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('admin', 'super_admin')
  );
$$;

CREATE FUNCTION public.is_email_registered(candidate_email text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'auth', 'public'
    AS $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(candidate_email))
  );
$$;

CREATE FUNCTION public.is_organizer() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role_locked
      and role::text = 'organizer'
  );
$$;

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'super_admin'
  );
$$;

CREATE FUNCTION public.record_legal_consent(accepted_terms_version text, accepted_privacy_version text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if accepted_terms_version <> '2026-09-22' or accepted_privacy_version <> '2026-09-22' then
    raise exception 'Unsupported legal document version';
  end if;

  update public.profiles
  set terms_accepted_at = coalesce(terms_accepted_at, now()),
      terms_version = coalesce(terms_version, accepted_terms_version),
      privacy_accepted_at = coalesce(privacy_accepted_at, now()),
      privacy_version = coalesce(privacy_version, accepted_privacy_version),
      legal_consent_required = false
  where id = auth.uid();
end;
$$;

CREATE FUNCTION public.set_profile_role(target_profile_id uuid, next_role public.app_role) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if not public.is_super_admin() then
    raise exception 'Only a super administrator can change roles';
  end if;

  if next_role::text = 'super_admin' then
    raise exception 'The super_admin role can only be assigned from the database';
  end if;

  if target_profile_id = auth.uid() then
    raise exception 'A super administrator cannot change their own role';
  end if;

  update public.profiles set role = next_role where id = target_profile_id;
  if not found then raise exception 'Profile not found'; end if;
end;
$$;

-- Trigger de Auth

-- Crea el perfil público al registrarse una cuenta en Auth.
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vistas

CREATE VIEW public.latest_login_accesses WITH (security_invoker='true') AS
 SELECT DISTINCT ON (account_id) account_id,
    accessed_at,
    ip_address,
    country,
    city,
    browser,
    operating_system,
    device_type
   FROM public.login_accesses
  ORDER BY account_id, accessed_at DESC;
