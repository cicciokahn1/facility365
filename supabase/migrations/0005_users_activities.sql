-- Facility365 – Benutzer und Aktivitaetshistorie
--
-- `users` fuehrt die Personen der Anwendung mit Rolle, Organisation,
-- zugewiesenen Standorten und dem Zustand aktiv/inaktiv. Geloescht wird hier
-- nichts, was noch Daten traegt; das Deaktivieren geschieht ueber das Feld
-- `status` im JSON.
--
-- `activities` ist die unveraenderbare Aenderungshistorie. Sie erlaubt nur
-- Einfuegen und Lesen - kein Update, kein Delete.

create table if not exists public.users (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists users_user_number_idx
  on public.users (user_id, number) where number <> '';

create index if not exists users_user_updated_idx on public.users (user_id, updated_at desc);

alter table public.users enable row level security;
alter table public.users force row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists users_delete_own on public.users;
create policy users_delete_own on public.users
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.users to authenticated;
revoke all on public.users from anon;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at before update on public.users
  for each row execute function public.touch_updated_at();

create table if not exists public.activities (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists activities_user_number_idx
  on public.activities (user_id, number) where number <> '';

create index if not exists activities_user_updated_idx on public.activities (user_id, updated_at desc);

alter table public.activities enable row level security;
alter table public.activities force row level security;

drop policy if exists activities_select_own on public.activities;
create policy activities_select_own on public.activities
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists activities_insert_own on public.activities;
create policy activities_insert_own on public.activities
  for insert to authenticated with check (auth.uid() = user_id);

-- Bewusst ohne Update- und Delete-Policy: die Historie bleibt unveraenderbar.
grant select, insert on public.activities to authenticated;
revoke all on public.activities from anon;
