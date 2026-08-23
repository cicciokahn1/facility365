-- Facility365 – Organisationen
--
-- Die Organisation ist die oberste Ebene der Objektstruktur
-- (Organisation → Standort → Liegenschaft → Gebäude → Raum → Anlage). Die Tabelle folgt
-- demselben Muster wie alle anderen Sammlungen: eine Zeile je Datensatz,
-- Zugehoerigkeit ueber `user_id`, fachliche Felder als `data`.

create table if not exists public.organizations (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists organizations_user_number_idx
  on public.organizations (user_id, number) where number <> '';

create index if not exists organizations_user_updated_idx on public.organizations (user_id, updated_at desc);

alter table public.organizations enable row level security;
alter table public.organizations force row level security;

drop policy if exists organizations_select_own on public.organizations;
create policy organizations_select_own on public.organizations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists organizations_insert_own on public.organizations;
create policy organizations_insert_own on public.organizations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists organizations_update_own on public.organizations;
create policy organizations_update_own on public.organizations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists organizations_delete_own on public.organizations;
create policy organizations_delete_own on public.organizations
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.organizations to authenticated;
revoke all on public.organizations from anon;

drop trigger if exists organizations_touch_updated_at on public.organizations;
create trigger organizations_touch_updated_at before update on public.organizations
  for each row execute function public.touch_updated_at();
