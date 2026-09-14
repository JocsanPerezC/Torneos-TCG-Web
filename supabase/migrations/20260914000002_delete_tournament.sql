-- Delete the complete tournament aggregate in dependency order.  The player
-- references use ON DELETE RESTRICT intentionally, so deleting tournaments
-- directly fails once a player appears in a table or a result.
create or replace function public.delete_tournament(tournament_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.is_tournament_owner(tournament_id) then
    raise exception 'Not authorized to delete this tournament';
  end if;

  delete from public.pod_results pr
  using public.pods po, public.rounds r
  where pr.pod_id = po.id
    and po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.pod_players pp
  using public.pods po, public.rounds r
  where pp.pod_id = po.id
    and po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.pods po
  using public.rounds r
  where po.round_id = r.id
    and r.tournament_id = delete_tournament.tournament_id;

  delete from public.rounds r
  where r.tournament_id = delete_tournament.tournament_id;

  delete from public.scoring_rules sr
  where sr.tournament_id = delete_tournament.tournament_id;

  delete from public.players p
  where p.tournament_id = delete_tournament.tournament_id;

  delete from public.tournaments t
  where t.id = delete_tournament.tournament_id;
end;
$$;

grant execute on function public.delete_tournament(uuid) to authenticated;
