-- This migration was already applied to the linked project.  Keeping it in
-- source control reconciles the migration history and makes fresh databases
-- reproduce the same schema.
alter table public.tournaments
  add column if not exists max_players integer not null default 32 check (max_players >= 3 and max_players <= 50),
  add column if not exists max_tables integer not null default 8 check (max_tables >= 1 and max_tables <= 25);
