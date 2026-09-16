-- Facility365 – Mandantenintegritaet fuer alle bestehenden Sammlungen
--
-- Die fruehere Mandantenmigration lief vor einzelnen spaeter ergaenzten
-- Sammlungen. Diese idempotente Nachsicherung stellt deshalb fuer jede
-- bekannte Anwendungssammlung dieselbe tenant_id- und RLS-Struktur her.
-- Bestehende Zeilen werden nur zugeordnet, nie geloescht oder ueberschrieben.

do $$
declare
  collection text;
  collections text[] := array[
    'customers', 'suppliers', 'sources', 'organizations', 'sites', 'properties',
    'buildings', 'rooms', 'assets', 'documents', 'energy', 'solarplants',
    'solaryields', 'appointments', 'orders', 'maintenances', 'legionella',
    'rcd', 'inspections', 'playgroundchecks', 'firechecks', 'keys', 'inventory',
    'vehicles', 'tools', 'stock', 'contracts', 'damages', 'tickets', 'reports',
    'quotes', 'invoices', 'cleaningareas', 'cleaners', 'cleaningplans',
    'cleaningtasks', 'cleaningchecks', 'cleaningcomplaints', 'users', 'activities'
  ];
begin
  foreach collection in array collections loop
    if to_regclass(format('public.%I', collection)) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;',
      collection
    );
    execute format(
      'alter table public.%I add column if not exists deleted_at timestamptz;',
      collection
    );
    execute format(
      'update public.%I item
       set tenant_id = membership.tenant_id
       from public.memberships membership
       where item.tenant_id is null
         and item.user_id = membership.auth_user_id;',
      collection
    );
    execute format(
      'alter table public.%I alter column tenant_id set default public.current_tenant();',
      collection
    );
    execute format(
      'create unique index if not exists %I on public.%I (tenant_id, id);',
      collection || '_tenant_id_idx',
      collection
    );
    execute format(
      'create unique index if not exists %I on public.%I (tenant_id, number) where number <> '''';',
      collection || '_tenant_number_idx',
      collection
    );
    execute format(
      'create index if not exists %I on public.%I (tenant_id, updated_at desc);',
      collection || '_tenant_updated_idx',
      collection
    );

    execute format('alter table public.%I enable row level security;', collection);
    execute format('alter table public.%I force row level security;', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_select_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_insert_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_update_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_delete_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_select_tenant', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_insert_tenant', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_update_tenant', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_delete_tenant', collection);

    execute format(
      'create policy %I on public.%I for select to authenticated
       using (tenant_id = public.current_tenant());',
      collection || '_select_tenant',
      collection
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated
       with check (tenant_id = public.current_tenant() and public.may_write());',
      collection || '_insert_tenant',
      collection
    );

    if collection = 'activities' then
      execute format('revoke update, delete on public.%I from authenticated;', collection);
    else
      execute format(
        'create policy %I on public.%I for update to authenticated
         using (tenant_id = public.current_tenant() and public.may_write())
         with check (tenant_id = public.current_tenant() and public.may_write());',
        collection || '_update_tenant',
        collection
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated
         using (tenant_id = public.current_tenant() and public.may_delete());',
        collection || '_delete_tenant',
        collection
      );
    end if;

    execute format(
      'grant %s on public.%I to authenticated;',
      case when collection = 'activities' then 'select, insert' else 'select, insert, update, delete' end,
      collection
    );
    execute format('revoke all on public.%I from anon;', collection);
  end loop;
end;
$$;

-- Die aktive Auswahl bleibt eindeutig und reproduzierbar, falls spaeter
-- mehrere Mitgliedschaften pro Konto zugelassen werden.
create or replace function public.current_tenant()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id
  from public.memberships m
  where m.auth_user_id = auth.uid()
    and m.status = 'active'
  order by m.created_at, m.tenant_id
  limit 1;
$$;

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.memberships m
  where m.auth_user_id = auth.uid()
    and m.status = 'active'
  order by m.created_at, m.tenant_id
  limit 1;
$$;
