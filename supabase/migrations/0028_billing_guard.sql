-- Facility365 – Lizenz- und Paketschutz (Vorbereitung, idempotent)
--
-- Voraussetzung: 0027_billing.sql wurde ausgefuehrt (billing_customers
-- existiert). Diese Migration aendert keine Daten.
--
-- 1. Guard: Sobald ein Mandant einen Kauf in billing_customers hat, duerfen
--    die Felder industryPackage und subscription in tenant_settings.data nur
--    noch durch den Service-Schluessel (Webhook/Betreiber) geaendert werden.
--    Ein orgadmin kann sich damit nicht selbst ein hoeheres Paket zuweisen.
--    Ohne Kauf bleibt die bisherige freie Paketwahl erhalten (Testphase).
--
-- 2. billing_customers lesbar fuer den eigenen Mandanten, damit die App den
--    Abo-Status anzeigen kann (nur lesen, nie schreiben).

create or replace function public.guard_tenant_package()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service- und Owner-Aufrufe (Webhook, SQL-Editor) duerfen alles.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;

  -- Ohne bestehenden Kauf ist die Paketwahl frei (Testphase, Selbstwahl).
  if not exists (
    select 1 from public.billing_customers b
    where b.tenant_id = new.tenant_id
  ) then
    return new;
  end if;

  -- Mit Kauf: Paket und Abo-Angaben sind gesperrt.
  if (new.data ->> 'industryPackage') is distinct from (old.data ->> 'industryPackage')
     or (new.data -> 'subscription') is distinct from (old.data -> 'subscription') then
    raise exception 'package_locked: Paket kann nach einem Kauf nur durch den Betreiber geaendert werden';
  end if;

  return new;
end;
$$;

drop trigger if exists tenant_settings_guard_package on public.tenant_settings;
create trigger tenant_settings_guard_package
  before update on public.tenant_settings
  for each row execute function public.guard_tenant_package();

-- Eigenen Abo-Status lesen (Schreiben bleibt dem Service vorbehalten).
drop policy if exists billing_customers_select_tenant on public.billing_customers;
create policy billing_customers_select_tenant on public.billing_customers
  for select to authenticated
  using (tenant_id = public.current_tenant());
grant select on public.billing_customers to authenticated;
