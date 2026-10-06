create or replace function public.enforce_tournament_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Serializing per profile prevents concurrent inserts from exceeding the limit.
  perform 1 from public.profiles where id = new.owner_id for update;

  if (select count(*) from public.tournaments where owner_id = new.owner_id) >= 10 then
    raise exception 'Solo puedes tener un máximo de 10 torneos.' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_tournament_limit() from public;

drop trigger if exists tournament_limit_before_insert on public.tournaments;
create trigger tournament_limit_before_insert
before insert on public.tournaments
for each row execute function public.enforce_tournament_limit();
