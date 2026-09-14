-- Authentication provider is informational only. It is never used for roles or RLS.
alter table public.profiles
  add column auth_provider text not null default 'email'
  check (auth_provider in ('email', 'google'));

-- Keep existing profiles accurate using trusted auth metadata.
update public.profiles as profile
set auth_provider = case
  when auth_user.raw_app_meta_data ->> 'provider' = 'google' then 'google'
  else 'email'
end
from auth.users as auth_user
where auth_user.id = profile.id;

-- New profiles get their provider from Supabase Auth's app metadata, not user input.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, auth_provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data ->> 'provider' = 'google' then 'google' else 'email' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
