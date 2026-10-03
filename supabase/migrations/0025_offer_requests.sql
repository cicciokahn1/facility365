-- Oeffentliche Angebotsanfragen der Preisseite.
-- Besucher duerfen nur eintragen; lesen darf niemand ohne Service-Key.
create table if not exists public.offer_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text not null,
  package text not null,
  modules text[] not null default '{}',
  message text not null default '',
  created_at timestamptz not null default now()
);

alter table public.offer_requests enable row level security;
alter table public.offer_requests force row level security;

drop policy if exists offer_requests_insert_public on public.offer_requests;
create policy offer_requests_insert_public on public.offer_requests
  for insert to anon, authenticated
  with check (true);

grant insert on public.offer_requests to anon;
revoke select, update, delete on public.offer_requests from anon;
