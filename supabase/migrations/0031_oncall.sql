-- Pikettdienst: Pikettperioden und Notfallmeldungen.
--
-- oncallincidents folgt der Standard-Regel: eigener Mandant + may_write().
-- oncallperiods beschraenkt das Schreiben zusaetzlich auf die
-- Verwaltungsrollen (superadmin/orgadmin/sitemanager): Mitarbeiter lesen
-- den Plan, koennen ihn aber nicht selbst aendern. Idempotent und ohne
-- Datenveraenderung.

create table if not exists public.oncallperiods (
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

create index if not exists oncallperiods_tenant_updated_idx
  on public.oncallperiods (tenant_id, updated_at desc);

alter table public.oncallperiods enable row level security;
alter table public.oncallperiods force row level security;

drop policy if exists oncallperiods_select_tenant on public.oncallperiods;
create policy oncallperiods_select_tenant on public.oncallperiods
  for select to authenticated
  using (tenant_id = public.current_tenant());

drop policy if exists oncallperiods_insert_admin on public.oncallperiods;
create policy oncallperiods_insert_admin on public.oncallperiods
  for insert to authenticated
  with check (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin', 'sitemanager')
  );

drop policy if exists oncallperiods_update_admin on public.oncallperiods;
create policy oncallperiods_update_admin on public.oncallperiods
  for update to authenticated
  using (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin', 'sitemanager')
  )
  with check (tenant_id = public.current_tenant());

drop policy if exists oncallperiods_delete_admin on public.oncallperiods;
create policy oncallperiods_delete_admin on public.oncallperiods
  for delete to authenticated
  using (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin', 'sitemanager')
  );

grant select, insert, update, delete on public.oncallperiods to authenticated;
revoke all on public.oncallperiods from anon;


create table if not exists public.oncallincidents (
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

create index if not exists oncallincidents_tenant_updated_idx
  on public.oncallincidents (tenant_id, updated_at desc);

alter table public.oncallincidents enable row level security;
alter table public.oncallincidents force row level security;

drop policy if exists oncallincidents_select_tenant on public.oncallincidents;
create policy oncallincidents_select_tenant on public.oncallincidents
  for select to authenticated
  using (tenant_id = public.current_tenant());

drop policy if exists oncallincidents_insert_tenant on public.oncallincidents;
create policy oncallincidents_insert_tenant on public.oncallincidents
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.may_write());

drop policy if exists oncallincidents_update_tenant on public.oncallincidents;
create policy oncallincidents_update_tenant on public.oncallincidents
  for update to authenticated
  using (tenant_id = public.current_tenant() and public.may_write())
  with check (tenant_id = public.current_tenant());

drop policy if exists oncallincidents_delete_tenant on public.oncallincidents;
create policy oncallincidents_delete_tenant on public.oncallincidents
  for delete to authenticated
  using (tenant_id = public.current_tenant() and public.may_delete());

grant select, insert, update, delete on public.oncallincidents to authenticated;
revoke all on public.oncallincidents from anon;
