-- Linked participants derive their public identity from the player profile.
create or replace function public.hydrate_linked_player_profile()
returns trigger language plpgsql security definer set search_path = public as $$
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

drop trigger if exists players_hydrate_linked_avatar on public.players;
create trigger players_hydrate_linked_profile
before insert or update of profile_id on public.players
for each row execute function public.hydrate_linked_player_profile();

create or replace function public.reject_linked_player_name_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.profile_id is not null
    and new.name is distinct from old.name
    and coalesce(current_setting('app.sync_linked_profile', true), '') <> 'true' then
    raise exception 'Linked participant names are managed by the player profile';
  end if;
  return new;
end;
$$;

drop trigger if exists players_reject_linked_name_updates on public.players;
create trigger players_reject_linked_name_updates
before update of name on public.players
for each row execute function public.reject_linked_player_name_update();

create or replace function public.sync_linked_player_profile()
returns trigger language plpgsql security definer set search_path = public as $$
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

drop trigger if exists profiles_sync_linked_avatars on public.profiles;
create trigger profiles_sync_linked_profile
after update of display_name, avatar_url on public.profiles
for each row execute function public.sync_linked_player_profile();

-- Backfill existing linked entries when another linked account in the
-- tournament does not already own the profile's current name.
alter table public.players disable trigger players_reject_linked_name_updates;
update public.players player
set name = profile.display_name,
    avatar_url = profile.avatar_url
from public.profiles profile
where player.profile_id = profile.id
  and nullif(trim(profile.display_name), '') is not null
  and (
    player.name is distinct from profile.display_name
    or player.avatar_url is distinct from profile.avatar_url
  )
  and not exists (
    select 1
    from public.players other_player
    where other_player.tournament_id = player.tournament_id
      and other_player.id <> player.id
      and other_player.profile_id is not null
      and other_player.normalized_name = lower(trim(profile.display_name))
  );
alter table public.players enable trigger players_reject_linked_name_updates;
