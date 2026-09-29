-- Private Inhalte gehoeren immer genau dem angemeldeten Konto.
-- Auch Administratoren sehen diese Zeilen nur, wenn sie selbst der Besitzer sind.

create table if not exists public.private_notes (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant() references public.tenants(id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id)
);

create table if not exists public.private_files (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant() references public.tenants(id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id)
);

create index if not exists private_notes_owner_idx
  on public.private_notes (tenant_id, user_id, updated_at desc);
create index if not exists private_files_owner_idx
  on public.private_files (tenant_id, user_id, updated_at desc);

alter table public.private_notes enable row level security;
alter table public.private_notes force row level security;
alter table public.private_files enable row level security;
alter table public.private_files force row level security;

drop policy if exists private_notes_select_own on public.private_notes;
create policy private_notes_select_own on public.private_notes
  for select to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_notes_insert_own on public.private_notes;
create policy private_notes_insert_own on public.private_notes
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_notes_update_own on public.private_notes;
create policy private_notes_update_own on public.private_notes
  for update to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid())
  with check (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_notes_delete_own on public.private_notes;
create policy private_notes_delete_own on public.private_notes
  for delete to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_files_select_own on public.private_files;
create policy private_files_select_own on public.private_files
  for select to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_files_insert_own on public.private_files;
create policy private_files_insert_own on public.private_files
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_files_update_own on public.private_files;
create policy private_files_update_own on public.private_files
  for update to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid())
  with check (tenant_id = public.current_tenant() and user_id = auth.uid());

drop policy if exists private_files_delete_own on public.private_files;
create policy private_files_delete_own on public.private_files
  for delete to authenticated
  using (tenant_id = public.current_tenant() and user_id = auth.uid());

grant select, insert, update, delete on public.private_notes to authenticated;
grant select, insert, update, delete on public.private_files to authenticated;
revoke all on public.private_notes from anon;
revoke all on public.private_files from anon;
