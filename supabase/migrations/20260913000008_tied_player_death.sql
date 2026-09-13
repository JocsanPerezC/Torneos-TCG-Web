alter table public.pod_results
  add column if not exists is_dead boolean not null default false;
