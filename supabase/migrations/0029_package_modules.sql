-- Facility365 – serverseitige Paketgrenze pro Sammlung (Vorbereitung)
--
-- Voraussetzung: 0018 (tenant-Policies) und 0027_billing.sql (billing_customers)
-- wurden ausgefuehrt. Diese Migration aendert keine Daten; sie ergaenzt die
-- bestehenden tenant-Policies um eine Paketpruefung.
--
-- Paketquelle (diese Reihenfolge):
--   1. billing_customers.package, wenn ein Kauf existiert und nicht gekuendigt
--   2. tenant_settings.data->>'industryPackage' (freie Wahl/Testphase)
--   '' oder 'custom' = keine Einschraenkung (Bestandskunden, kompatibel).
--
-- institution ist rückwärtskompatibel enthalten (gleiche Modulliste wie im Code).
-- Abweisung: Zeilen eines nicht gebuchten Moduls sind unsichtbar (select) und
-- nicht schreibbar (insert/update/delete via with check) -> zuverlaessiger
-- deny, ohne fremde Mandanten anzufassen.

create or replace function public.package_modules(pkg text)
returns text[]
language sql
immutable
as $$
  select case pkg
    when 'starter' then array[]::text[]
    when 'professional' then null::text[]   -- null = alle optionalen Module
    when 'enterprise' then null::text[]
    when 'property' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'legionella','rcd','inspections','playgroundchecks','firechecks',
      'contracts','quotes','invoices','analytics','portal','vehicles']
    when 'care' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'legionella','rcd','inspections','playgroundchecks','firechecks',
      'cleaning','cleaningtasks','cleaningplans','cleaningareas','cleaners',
      'cleaningchecks','cleaningcomplaints','contracts','analytics']
    when 'institution' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'legionella','rcd','inspections','playgroundchecks','firechecks',
      'cleaning','cleaningtasks','cleaningplans','cleaningareas','cleaners',
      'cleaningchecks','cleaningcomplaints','contracts','analytics']
    when 'industry' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'vehicles','legionella','rcd','inspections','playgroundchecks','firechecks',
      'contracts','quotes','invoices','analytics','portal','hazards']
    when 'public' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'vehicles','legionella','rcd','inspections','playgroundchecks','firechecks',
      'cleaning','cleaningtasks','cleaningplans','cleaningareas','cleaners',
      'cleaningchecks','cleaningcomplaints','contracts','analytics','portal','hazards']
    when 'hospital' then array[
      'organizations','sites','suppliers','sources',
      'energy','solarplants','solaryields','keys','inventory','tools','stock',
      'legionella','rcd','inspections','playgroundchecks','firechecks',
      'cleaning','cleaningtasks','cleaningplans','cleaningareas','cleaners',
      'cleaningchecks','cleaningcomplaints','contracts','analytics','visitors','hazards']
    else array[]::text[]  -- unbekanntes Paket = restriktiv
  end;
$$;

create or replace function public.tenant_package()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select b.package
       from public.billing_customers b
      where b.tenant_id = public.current_tenant()
        and b.status <> 'canceled'),
    (select s.data ->> 'industryPackage'
       from public.tenant_settings s
      where s.tenant_id = public.current_tenant()),
    ''
  );
$$;

create or replace function public.collection_allowed(collection text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pkg text := public.tenant_package();
  modules text[];
begin
  -- Paket ''/'custom'/null = keine Einschraenkung (Legacy/Testphase).
  if pkg is null or pkg = '' or pkg = 'custom' then
    return true;
  end if;
  modules := public.package_modules(pkg);
  -- null = alle Module erlaubt (professional/enterprise).
  if modules is null then
    return true;
  end if;
  return collection = any (modules);
end;
$$;

-- Collection -> Modul: Collectionname entspricht dem Modulnamen.
do $$
declare
  coll text;
  gated text[] := array[
    'organizations','sites','suppliers','sources',
    'energy','solarplants','solaryields','keys','inventory','tools','stock',
    'legionella','rcd','inspections','playgroundchecks','firechecks',
    'cleaningareas','cleaners','cleaningplans','cleaningtasks','cleaningchecks','cleaningcomplaints',
    'contracts','quotes','invoices',
    'vehicles','visitors','parking','waste','hazards'
  ];
begin
  foreach coll in array gated loop
    if to_regclass(format('public.%I', coll)) is null then
      continue;
    end if;

    execute format('drop policy if exists %I on public.%I;', coll || '_select_tenant', coll);
    execute format('drop policy if exists %I on public.%I;', coll || '_insert_tenant', coll);
    execute format('drop policy if exists %I on public.%I;', coll || '_update_tenant', coll);
    execute format('drop policy if exists %I on public.%I;', coll || '_delete_tenant', coll);

    execute format(
      'create policy %I on public.%I for select to authenticated
       using (tenant_id = public.current_tenant() and public.collection_allowed(%L));',
      coll || '_select_tenant', coll, coll);
    execute format(
      'create policy %I on public.%I for insert to authenticated
       with check (tenant_id = public.current_tenant() and public.may_write()
                   and public.collection_allowed(%L));',
      coll || '_insert_tenant', coll, coll);
    execute format(
      'create policy %I on public.%I for update to authenticated
       using (tenant_id = public.current_tenant() and public.may_write()
              and public.collection_allowed(%L))
       with check (tenant_id = public.current_tenant() and public.may_write()
                   and public.collection_allowed(%L));',
      coll || '_update_tenant', coll, coll, coll);
    execute format(
      'create policy %I on public.%I for delete to authenticated
       using (tenant_id = public.current_tenant() and public.may_delete()
              and public.collection_allowed(%L));',
      coll || '_delete_tenant', coll, coll);
  end loop;
end;
$$;

-- Rollback:
--   Diese Datei nochmals mit public.collection_allowed ersetzt durch 'true'
--   ausfuehren, oder die Policies aus 0018 erneut erstellen lassen;
--   anschliessend: drop function public.collection_allowed, tenant_package,
--   package_modules. Keine Daten gehen verloren.
