-- Close unattended rounds after 48 hours with a one-point draw for every player.
create or replace function public.complete_expired_rounds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_count integer;
begin
  with expired_rounds as (
    update public.rounds
    set status = 'completada',
        ended_at = started_at + interval '48 hours'
    where status = 'activa'
      and started_at <= now() - interval '48 hours'
    returning id
  ), completed_results as (
    insert into public.pod_results (pod_id, player_id, position, kills, is_dead, points, outcome)
    select pod.id, pod_player.player_id, null, 0, false, 1, 'draw'::public.pod_result_outcome
    from expired_rounds round
    join public.pods pod on pod.round_id = round.id
    join public.pod_players pod_player on pod_player.pod_id = pod.id
    on conflict (pod_id, player_id) do update
    set position = null,
        kills = 0,
        is_dead = false,
        points = 1,
        outcome = 'draw'::public.pod_result_outcome
    returning pod_id
  )
  select count(*) into completed_count from expired_rounds;

  return completed_count;
end;
$$;

alter table public.pod_results
  drop constraint if exists pod_results_kills_check,
  drop constraint if exists pod_results_kills_range,
  add constraint pod_results_kills_range check (kills between 0 and 5);

revoke execute on function public.complete_expired_rounds() from public, anon, authenticated;

-- A stale client snapshot cannot reopen a round that the scheduler has already expired.
create or replace function public.enforce_expired_round_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'activa'
    and new.started_at <= now() - interval '48 hours' then
    perform public.complete_expired_rounds();
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_expired_round_completion on public.rounds;

create constraint trigger enforce_expired_round_completion
after insert or update of status, started_at on public.rounds
deferrable initially deferred
for each row
execute function public.enforce_expired_round_completion();

create extension if not exists pg_cron;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'complete-expired-rounds';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'complete-expired-rounds',
    '*/5 * * * *',
    'select public.complete_expired_rounds()'
  );
end;
$$;
