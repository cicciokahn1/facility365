-- Facility365 – Inventar, Fahrzeuge und Werkzeuge
--
-- Drei zusaetzliche Sammlungen nach demselben Muster wie die bestehenden
-- Tabellen; vorhandene Daten bleiben unveraendert.

create table if not exists public.inventory (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists inventory_user_number_idx
  on public.inventory (user_id, number) where number <> '';

create index if not exists inventory_user_updated_idx on public.inventory (user_id, updated_at desc);

alter table public.inventory enable row level security;
alter table public.inventory force row level security;

drop policy if exists inventory_select_own on public.inventory;
create policy inventory_select_own on public.inventory
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists inventory_insert_own on public.inventory;
create policy inventory_insert_own on public.inventory
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists inventory_update_own on public.inventory;
create policy inventory_update_own on public.inventory
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists inventory_delete_own on public.inventory;
create policy inventory_delete_own on public.inventory
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.inventory to authenticated;
revoke all on public.inventory from anon;

drop trigger if exists inventory_touch_updated_at on public.inventory;
create trigger inventory_touch_updated_at before update on public.inventory
  for each row execute function public.touch_updated_at();

create table if not exists public.vehicles (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists vehicles_user_number_idx
  on public.vehicles (user_id, number) where number <> '';

create index if not exists vehicles_user_updated_idx on public.vehicles (user_id, updated_at desc);

alter table public.vehicles enable row level security;
alter table public.vehicles force row level security;

drop policy if exists vehicles_select_own on public.vehicles;
create policy vehicles_select_own on public.vehicles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists vehicles_insert_own on public.vehicles;
create policy vehicles_insert_own on public.vehicles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists vehicles_update_own on public.vehicles;
create policy vehicles_update_own on public.vehicles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists vehicles_delete_own on public.vehicles;
create policy vehicles_delete_own on public.vehicles
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.vehicles to authenticated;
revoke all on public.vehicles from anon;

drop trigger if exists vehicles_touch_updated_at on public.vehicles;
create trigger vehicles_touch_updated_at before update on public.vehicles
  for each row execute function public.touch_updated_at();

create table if not exists public.tools (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists tools_user_number_idx
  on public.tools (user_id, number) where number <> '';

create index if not exists tools_user_updated_idx on public.tools (user_id, updated_at desc);

alter table public.tools enable row level security;
alter table public.tools force row level security;

drop policy if exists tools_select_own on public.tools;
create policy tools_select_own on public.tools
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists tools_insert_own on public.tools;
create policy tools_insert_own on public.tools
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists tools_update_own on public.tools;
create policy tools_update_own on public.tools
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists tools_delete_own on public.tools;
create policy tools_delete_own on public.tools
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.tools to authenticated;
revoke all on public.tools from anon;

drop trigger if exists tools_touch_updated_at on public.tools;
create trigger tools_touch_updated_at before update on public.tools
  for each row execute function public.touch_updated_at();
