-- Facility365 – Reinigung
--
-- Jede Sammlung des Reinigungsmoduls folgt demselben Muster wie die
-- uebrigen Tabellen: eine Zeile je Datensatz, Zugehoerigkeit ueber
-- `user_id`, fachliche Felder als `data`.

-- Reinigungsbereiche
create table if not exists public.cleaningareas (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaningareas_user_number_idx
  on public.cleaningareas (user_id, number) where number <> '';

create index if not exists cleaningareas_user_updated_idx on public.cleaningareas (user_id, updated_at desc);

alter table public.cleaningareas enable row level security;
alter table public.cleaningareas force row level security;

drop policy if exists cleaningareas_select_own on public.cleaningareas;
create policy cleaningareas_select_own on public.cleaningareas
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaningareas_insert_own on public.cleaningareas;
create policy cleaningareas_insert_own on public.cleaningareas
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaningareas_update_own on public.cleaningareas;
create policy cleaningareas_update_own on public.cleaningareas
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaningareas_delete_own on public.cleaningareas;
create policy cleaningareas_delete_own on public.cleaningareas
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaningareas to authenticated;
revoke all on public.cleaningareas from anon;

drop trigger if exists cleaningareas_touch_updated_at on public.cleaningareas;
create trigger cleaningareas_touch_updated_at before update on public.cleaningareas
  for each row execute function public.touch_updated_at();

-- Reinigungskraefte
create table if not exists public.cleaners (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaners_user_number_idx
  on public.cleaners (user_id, number) where number <> '';

create index if not exists cleaners_user_updated_idx on public.cleaners (user_id, updated_at desc);

alter table public.cleaners enable row level security;
alter table public.cleaners force row level security;

drop policy if exists cleaners_select_own on public.cleaners;
create policy cleaners_select_own on public.cleaners
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaners_insert_own on public.cleaners;
create policy cleaners_insert_own on public.cleaners
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaners_update_own on public.cleaners;
create policy cleaners_update_own on public.cleaners
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaners_delete_own on public.cleaners;
create policy cleaners_delete_own on public.cleaners
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaners to authenticated;
revoke all on public.cleaners from anon;

drop trigger if exists cleaners_touch_updated_at on public.cleaners;
create trigger cleaners_touch_updated_at before update on public.cleaners
  for each row execute function public.touch_updated_at();

-- Reinigungsplaene
create table if not exists public.cleaningplans (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaningplans_user_number_idx
  on public.cleaningplans (user_id, number) where number <> '';

create index if not exists cleaningplans_user_updated_idx on public.cleaningplans (user_id, updated_at desc);

alter table public.cleaningplans enable row level security;
alter table public.cleaningplans force row level security;

drop policy if exists cleaningplans_select_own on public.cleaningplans;
create policy cleaningplans_select_own on public.cleaningplans
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaningplans_insert_own on public.cleaningplans;
create policy cleaningplans_insert_own on public.cleaningplans
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaningplans_update_own on public.cleaningplans;
create policy cleaningplans_update_own on public.cleaningplans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaningplans_delete_own on public.cleaningplans;
create policy cleaningplans_delete_own on public.cleaningplans
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaningplans to authenticated;
revoke all on public.cleaningplans from anon;

drop trigger if exists cleaningplans_touch_updated_at on public.cleaningplans;
create trigger cleaningplans_touch_updated_at before update on public.cleaningplans
  for each row execute function public.touch_updated_at();

-- Reinigungsaufgaben
create table if not exists public.cleaningtasks (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaningtasks_user_number_idx
  on public.cleaningtasks (user_id, number) where number <> '';

create index if not exists cleaningtasks_user_updated_idx on public.cleaningtasks (user_id, updated_at desc);

alter table public.cleaningtasks enable row level security;
alter table public.cleaningtasks force row level security;

drop policy if exists cleaningtasks_select_own on public.cleaningtasks;
create policy cleaningtasks_select_own on public.cleaningtasks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaningtasks_insert_own on public.cleaningtasks;
create policy cleaningtasks_insert_own on public.cleaningtasks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaningtasks_update_own on public.cleaningtasks;
create policy cleaningtasks_update_own on public.cleaningtasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaningtasks_delete_own on public.cleaningtasks;
create policy cleaningtasks_delete_own on public.cleaningtasks
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaningtasks to authenticated;
revoke all on public.cleaningtasks from anon;

drop trigger if exists cleaningtasks_touch_updated_at on public.cleaningtasks;
create trigger cleaningtasks_touch_updated_at before update on public.cleaningtasks
  for each row execute function public.touch_updated_at();

-- Reinigungskontrollen
create table if not exists public.cleaningchecks (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaningchecks_user_number_idx
  on public.cleaningchecks (user_id, number) where number <> '';

create index if not exists cleaningchecks_user_updated_idx on public.cleaningchecks (user_id, updated_at desc);

alter table public.cleaningchecks enable row level security;
alter table public.cleaningchecks force row level security;

drop policy if exists cleaningchecks_select_own on public.cleaningchecks;
create policy cleaningchecks_select_own on public.cleaningchecks
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaningchecks_insert_own on public.cleaningchecks;
create policy cleaningchecks_insert_own on public.cleaningchecks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaningchecks_update_own on public.cleaningchecks;
create policy cleaningchecks_update_own on public.cleaningchecks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaningchecks_delete_own on public.cleaningchecks;
create policy cleaningchecks_delete_own on public.cleaningchecks
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaningchecks to authenticated;
revoke all on public.cleaningchecks from anon;

drop trigger if exists cleaningchecks_touch_updated_at on public.cleaningchecks;
create trigger cleaningchecks_touch_updated_at before update on public.cleaningchecks
  for each row execute function public.touch_updated_at();

-- Reklamationen der Reinigung
create table if not exists public.cleaningcomplaints (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create unique index if not exists cleaningcomplaints_user_number_idx
  on public.cleaningcomplaints (user_id, number) where number <> '';

create index if not exists cleaningcomplaints_user_updated_idx on public.cleaningcomplaints (user_id, updated_at desc);

alter table public.cleaningcomplaints enable row level security;
alter table public.cleaningcomplaints force row level security;

drop policy if exists cleaningcomplaints_select_own on public.cleaningcomplaints;
create policy cleaningcomplaints_select_own on public.cleaningcomplaints
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists cleaningcomplaints_insert_own on public.cleaningcomplaints;
create policy cleaningcomplaints_insert_own on public.cleaningcomplaints
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists cleaningcomplaints_update_own on public.cleaningcomplaints;
create policy cleaningcomplaints_update_own on public.cleaningcomplaints
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cleaningcomplaints_delete_own on public.cleaningcomplaints;
create policy cleaningcomplaints_delete_own on public.cleaningcomplaints
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.cleaningcomplaints to authenticated;
revoke all on public.cleaningcomplaints from anon;

drop trigger if exists cleaningcomplaints_touch_updated_at on public.cleaningcomplaints;
create trigger cleaningcomplaints_touch_updated_at before update on public.cleaningcomplaints
  for each row execute function public.touch_updated_at();
