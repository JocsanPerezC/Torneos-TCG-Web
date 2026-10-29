alter table public.profiles add column if not exists avatar_url text;
alter table public.players add column if not exists avatar_url text;

grant update (display_name, avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public profile avatar read" on storage.objects;
drop policy if exists "users manage their profile avatar" on storage.objects;
create policy "public profile avatar read" on storage.objects for select
using (bucket_id = 'profile-avatars');
create policy "users manage their profile avatar" on storage.objects for all to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

update public.profiles profile
set avatar_url = coalesce(auth_user.raw_user_meta_data ->> 'avatar_url', auth_user.raw_user_meta_data ->> 'picture')
from auth.users auth_user
where profile.id = auth_user.id and profile.avatar_url is null;

update public.players player
set avatar_url = profile.avatar_url
from public.profiles profile
where player.profile_id = profile.id and player.avatar_url is distinct from profile.avatar_url;

create or replace function public.hydrate_linked_player_avatar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.profile_id is not null then
    select avatar_url into new.avatar_url from public.profiles where id = new.profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists players_hydrate_linked_avatar on public.players;
create trigger players_hydrate_linked_avatar
before insert or update of profile_id on public.players
for each row execute function public.hydrate_linked_player_avatar();

create or replace function public.sync_linked_player_avatars()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.players set avatar_url = new.avatar_url where profile_id = new.id;
  return new;
end;
$$;

drop trigger if exists profiles_sync_linked_avatars on public.profiles;
create trigger profiles_sync_linked_avatars
after update of avatar_url on public.profiles
for each row execute function public.sync_linked_player_avatars();

create or replace function public.get_public_tournament(slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'format', t.format, 'information', t.information, 'plannedRounds', t.planned_rounds,
    'status', t.status, 'isPublic', t.is_public, 'publicSlug', t.public_slug,
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'active', p.is_active, 'tieBreaker', p.tie_breaker,
      'avatarUrl', p.avatar_url
    ) order by p.name) from players p where p.tournament_id = t.id), '[]'::jsonb),
    'rounds', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'number', r.number, 'status', r.status, 'seed', r.seed, 'startedAt', r.started_at, 'endedAt', r.ended_at, 'pods', coalesce((select jsonb_agg(jsonb_build_object('id', po.id, 'number', po.number, 'playerIds', coalesce((select jsonb_agg(pp.player_id order by pp.player_id) from pod_players pp where pp.pod_id = po.id), '[]'::jsonb), 'results', coalesce((select jsonb_agg(jsonb_build_object('playerId', pr.player_id, 'points', pr.points, 'kills', pr.kills, 'outcome', pr.outcome) order by pr.player_id) from pod_results pr where pr.pod_id = po.id), '[]'::jsonb)) order by po.number) from pods po where po.round_id = r.id), '[]'::jsonb)) order by r.number) from rounds r where r.tournament_id = t.id), '[]'::jsonb),
    'createdAt', t.created_at
  ) from tournaments t where t.public_slug = slug and t.is_public = true;
$$;
