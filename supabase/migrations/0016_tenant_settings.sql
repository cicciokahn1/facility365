-- Facility365 – Mandantweite Einstellungen fuer Branchenpaket und Module
--
-- Die Modulkonfiguration gehoert zum Mandanten, nicht zum einzelnen
-- Anmeldekonto. Dadurch sehen alle Personen einer Organisation dieselbe
-- Ausgangskonfiguration und dieselben manuellen Ueberschreibungen.

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.tenant_settings enable row level security;
alter table public.tenant_settings force row level security;

drop policy if exists tenant_settings_select_tenant on public.tenant_settings;
create policy tenant_settings_select_tenant on public.tenant_settings
  for select to authenticated
  using (tenant_id = public.current_tenant());

drop policy if exists tenant_settings_insert_admin on public.tenant_settings;
create policy tenant_settings_insert_admin on public.tenant_settings
  for insert to authenticated
  with check (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin')
  );

drop policy if exists tenant_settings_update_admin on public.tenant_settings;
create policy tenant_settings_update_admin on public.tenant_settings
  for update to authenticated
  using (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin')
  )
  with check (
    tenant_id = public.current_tenant()
    and public.current_role_name() in ('superadmin', 'orgadmin')
  );

grant select, insert, update on public.tenant_settings to authenticated;
revoke all on public.tenant_settings from anon;
