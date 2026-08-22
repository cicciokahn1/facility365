-- Facility365 – Standorte (Multi-Standort)
--
-- Der Standort ist die oberste Ebene der Objektstruktur
-- (Standort → Liegenschaft → Gebäude → Raum → Anlage). Die Tabelle folgt
-- demselben Muster wie alle anderen Sammlungen: eine Zeile je Datensatz,
-- Zugehoerigkeit ueber `user_id`, fachliche Felder als `data`.

create table if not exists public.sites (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists sites_user_number_idx
  on public.sites (user_id, number) where number <> '';

create index if not exists sites_user_updated_idx on public.sites (user_id, updated_at desc);

alter table public.sites enable row level security;
alter table public.sites force row level security;

drop policy if exists sites_select_own on public.sites;
create policy sites_select_own on public.sites
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists sites_insert_own on public.sites;
create policy sites_insert_own on public.sites
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists sites_update_own on public.sites;
create policy sites_update_own on public.sites
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists sites_delete_own on public.sites;
create policy sites_delete_own on public.sites
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.sites to authenticated;
revoke all on public.sites from anon;

drop trigger if exists sites_touch_updated_at on public.sites;
create trigger sites_touch_updated_at before update on public.sites
  for each row execute function public.touch_updated_at();
