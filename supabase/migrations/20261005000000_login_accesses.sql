-- Login audit data is written by the authenticated edge function. Keeping this
-- separate from profiles avoids changing or overwriting existing account data.
create table public.login_accesses (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.profiles(id) on delete cascade,
  accessed_at timestamptz not null default now(),
  ip_address inet,
  country text not null default 'Ubicación no disponible',
  city text not null default 'Ubicación no disponible',
  browser text not null default 'Navegador no disponible',
  operating_system text not null default 'Sistema operativo no disponible',
  device_type text not null default 'Dispositivo no disponible'
);

create index login_accesses_account_accessed_at_idx
  on public.login_accesses (account_id, accessed_at desc);

create view public.latest_login_accesses
with (security_invoker = true) as
  select distinct on (account_id)
    account_id,
    accessed_at,
    ip_address,
    country,
    city,
    browser,
    operating_system,
    device_type
  from public.login_accesses
  order by account_id, accessed_at desc;

comment on table public.login_accesses is
  'Successful login audit records. Entries are retained until a future maintenance policy removes them.';

alter table public.login_accesses enable row level security;
