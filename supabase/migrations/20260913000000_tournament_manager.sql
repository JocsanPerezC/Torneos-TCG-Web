-- Torneos TCG: relational tournament model. Apply with `supabase db push`.
create extension if not exists pgcrypto;
create type public.tournament_status as enum ('borrador','activo','finalizado');
create type public.round_status as enum ('borrador','activa','completada');
create type public.result_type as enum ('normal','combo');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz not null default now());
create table public.tournaments (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade, name text not null check (length(trim(name)) > 0), format text not null default 'Commander', planned_rounds integer not null check (planned_rounds > 0), status public.tournament_status not null default 'borrador', is_public boolean not null default false, public_slug text unique not null default replace(gen_random_uuid()::text, '-', ''), created_at timestamptz not null default now());
create table public.scoring_rules (tournament_id uuid primary key references public.tournaments(id) on delete cascade, first_place integer not null default 3 check(first_place >= 0), second_place integer not null default 2 check(second_place >= 0), third_place integer not null default 1 check(third_place >= 0), fourth_place integer not null default 0 check(fourth_place >= 0), combo_winner integer not null default 3 check(combo_winner >= 0), combo_other integer not null default 1 check(combo_other >= 0));
create table public.players (id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade, name text not null check(length(trim(name)) > 0), normalized_name text generated always as (lower(trim(name))) stored, is_active boolean not null default true, tie_breaker integer not null default 0, unique(tournament_id, normalized_name));
create table public.rounds (id uuid primary key default gen_random_uuid(), tournament_id uuid not null references public.tournaments(id) on delete cascade, number integer not null check(number > 0), status public.round_status not null default 'borrador', seed bigint not null, unique(tournament_id,number));
create table public.pods (id uuid primary key default gen_random_uuid(), round_id uuid not null references public.rounds(id) on delete cascade, number integer not null check(number > 0), result_type public.result_type, notes text, unique(round_id,number));
create table public.pod_players (pod_id uuid not null references public.pods(id) on delete cascade, player_id uuid not null references public.players(id) on delete restrict, primary key(pod_id,player_id));
create table public.pod_results (pod_id uuid not null references public.pods(id) on delete cascade, player_id uuid not null references public.players(id) on delete restrict, position integer not null check(position > 0), kills integer not null default 0 check(kills >= 0), primary key(pod_id,player_id), unique(pod_id,position));
create or replace function public.prevent_duplicate_round_assignment() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.pod_players pp join public.pods other_pod on other_pod.id=pp.pod_id join public.pods new_pod on new_pod.id=new.pod_id where pp.player_id=new.player_id and other_pod.round_id=new_pod.round_id and pp.pod_id<>new.pod_id) then
    raise exception 'A player may only be assigned once per round';
  end if;
  return new;
end $$;
create trigger pod_player_once_per_round before insert or update on public.pod_players for each row execute function public.prevent_duplicate_round_assignment();
create index rounds_tournament_idx on public.rounds(tournament_id); create index pods_round_idx on public.pods(round_id); create index players_tournament_idx on public.players(tournament_id);

create or replace function public.is_tournament_owner(tid uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from tournaments where id=tid and owner_id=auth.uid()) $$;
alter table public.profiles enable row level security; alter table public.tournaments enable row level security; alter table public.scoring_rules enable row level security; alter table public.players enable row level security; alter table public.rounds enable row level security; alter table public.pods enable row level security; alter table public.pod_players enable row level security; alter table public.pod_results enable row level security;
create policy "profile own" on public.profiles for all using (id=auth.uid()) with check(id=auth.uid());
create policy "owner tournament" on public.tournaments for all using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "public tournament read" on public.tournaments for select using(is_public);
create policy "owner scoring" on public.scoring_rules for all using(public.is_tournament_owner(tournament_id)) with check(public.is_tournament_owner(tournament_id));
create policy "owner players" on public.players for all using(public.is_tournament_owner(tournament_id)) with check(public.is_tournament_owner(tournament_id));
create policy "owner rounds" on public.rounds for all using(public.is_tournament_owner(tournament_id)) with check(public.is_tournament_owner(tournament_id));
create policy "owner pods" on public.pods for all using(exists(select 1 from public.rounds r where r.id=round_id and public.is_tournament_owner(r.tournament_id))) with check(exists(select 1 from public.rounds r where r.id=round_id and public.is_tournament_owner(r.tournament_id)));
create policy "owner pod players" on public.pod_players for all using(exists(select 1 from public.pods p join public.rounds r on r.id=p.round_id where p.id=pod_id and public.is_tournament_owner(r.tournament_id))) with check(exists(select 1 from public.pods p join public.rounds r on r.id=p.round_id where p.id=pod_id and public.is_tournament_owner(r.tournament_id)));
create policy "owner pod results" on public.pod_results for all using(exists(select 1 from public.pods p join public.rounds r on r.id=p.round_id where p.id=pod_id and public.is_tournament_owner(r.tournament_id))) with check(exists(select 1 from public.pods p join public.rounds r on r.id=p.round_id where p.id=pod_id and public.is_tournament_owner(r.tournament_id)));
-- Public readers use a safe view rather than direct child-table access.
create view public.published_tournament_snapshot with (security_invoker=true) as select t.id,t.name,t.format,t.public_slug,t.status,r.number as round_number,r.status as round_status from public.tournaments t left join public.rounds r on r.tournament_id=t.id where t.is_public;
grant select on public.published_tournament_snapshot to anon, authenticated;
