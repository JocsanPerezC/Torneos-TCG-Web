-- A tied table gives every player first place. Other result types may share
-- second or third place (for example, when a combo ends a multiplayer game).
alter type public.result_type add value if not exists 'empate';

alter table public.pod_results
  drop constraint if exists pod_results_pod_id_position_key;
