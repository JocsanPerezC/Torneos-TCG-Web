-- Legacy clients stored a materialized score.  The current client calculates
-- standings from placement, so this compatibility field defaults to zero.
alter table public.pod_results
  add column if not exists points integer not null default 0 check (points >= 0);
