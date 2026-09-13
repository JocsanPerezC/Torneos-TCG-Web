-- A round is generated first, then explicitly started and finished.
alter table public.rounds
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz;
