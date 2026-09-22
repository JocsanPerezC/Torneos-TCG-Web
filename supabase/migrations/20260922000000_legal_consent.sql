-- Records consent for new accounts without changing existing accounts or authentication flows.
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists legal_consent_required boolean not null default false;

-- Email registration includes legal_consent in trusted user metadata. The server
-- timestamp, rather than a browser timestamp, is stored for the accepted version.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, display_name, auth_provider, terms_accepted_at, terms_version,
    privacy_accepted_at, privacy_version, legal_consent_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end,
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

-- Google OAuth returns to the authenticated browser, where an accepted new-user
-- consent is recorded with a server timestamp. Existing acceptance is preserved.
create or replace function public.record_legal_consent(
  accepted_terms_version text,
  accepted_privacy_version text
)
returns void language plpgsql security definer set search_path = public as $$
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

grant execute on function public.record_legal_consent(text, text) to authenticated;
