-- Security-definer functions run with search_path restricted to public. Use
-- PostgreSQL's built-in UUID generator so token creation does not depend on
-- resolving an extension function from another schema.
create or replace function public.create_or_rotate_tournament_join_link(p_tournament_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if not public.is_tournament_owner(p_tournament_id) then
    raise exception 'You cannot manage this tournament';
  end if;

  insert into public.tournament_join_links (tournament_id, token, revoked_at)
  values (p_tournament_id, next_token, null)
  on conflict (tournament_id) do update
    set token = excluded.token,
        created_at = now(),
        revoked_at = null;

  return next_token;
end;
$$;
