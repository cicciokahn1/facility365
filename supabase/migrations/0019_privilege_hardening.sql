-- Facility365 – explizite API-Rechte für die bestehenden Mandantentabellen
--
-- RLS und die bereits vorhandenen Mandanten-Policies bleiben die fachliche
-- Zugriffskontrolle. Diese Migration normalisiert nur die PostgreSQL-Rechte:
-- anon erhält keinen Tabellenzugriff; authenticated arbeitet über RLS;
-- service_role bleibt ein ausschliesslich serverseitiger Integrationszugang.

do $$
declare
  table_name text;
  app_tables text[] := array[
    'customers', 'suppliers', 'sources', 'organizations', 'sites', 'properties',
    'buildings', 'rooms', 'assets', 'documents', 'energy', 'solarplants',
    'solaryields', 'appointments', 'orders', 'maintenances', 'legionella',
    'rcd', 'inspections', 'playgroundchecks', 'firechecks', 'keys', 'inventory',
    'vehicles', 'tools', 'stock', 'contracts', 'damages', 'tickets', 'reports',
    'quotes', 'invoices', 'cleaningareas', 'cleaners', 'cleaningplans',
    'cleaningtasks', 'cleaningchecks', 'cleaningcomplaints', 'users', 'activities',
    'tenant_settings', 'backups'
  ];
begin
  foreach table_name in array app_tables loop
    if to_regclass(format('public.%I', table_name)) is null then
      continue;
    end if;

    execute format('revoke all on table public.%I from anon;', table_name);

    if table_name = 'activities' then
      execute format('grant select, insert on table public.%I to authenticated;', table_name);
      execute format('grant select, insert on table public.%I to service_role;', table_name);
      execute format('revoke update, delete on table public.%I from authenticated, service_role;', table_name);
    else
      execute format('grant select, insert, update, delete on table public.%I to authenticated;', table_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role;', table_name);
    end if;
  end loop;
end;
$$;

-- Neue Tabellen werden nicht versehentlich öffentlich, bevor eine eigene
-- RLS-Regel und ein passender Grant dafür definiert wurden.
alter default privileges in schema public
  revoke all on tables from anon;
