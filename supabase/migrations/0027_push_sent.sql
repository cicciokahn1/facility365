-- Dedupe fuer Server-Push: jede Ereigniskennung wird nur einmal versendet.
create table if not exists public.push_sent (
  tag text primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.push_sent enable row level security;
alter table public.push_sent force row level security;

revoke all on public.push_sent from anon;
revoke all on public.push_sent from authenticated;
