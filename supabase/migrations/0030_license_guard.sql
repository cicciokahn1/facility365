-- 0030_license_guard.sql
-- P0-Fix (Vorschlag, noch nicht ausgefuehrt):
-- Verhindert, dass eine Mandanten-Leitung ihre Lizenz oder Testfrist selbst
-- aendert (plan / trial_started_at / trial_ends_at). Die Update-Regel
-- tenants_update_admin erlaubt der Leitung sonst jedes Feld der Zeile.
-- Die serverseitige Funktion extend_trial darf die Frist weiter anpassen.

alter table public.tenants add column if not exists plan text not null default 'licensed';
alter table public.tenants add column if not exists trial_started_at timestamptz;
alter table public.tenants add column if not exists trial_ends_at timestamptz;

create or replace function public.extend_trial(days integer)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  tenant uuid := public.current_tenant();
  ends timestamptz;
begin
  if tenant is null or public.current_role_name() not in ('superadmin', 'orgadmin') then
    raise exception 'not allowed';
  end if;
  if days is null or days < 1 or days > public.trial_days() then
    raise exception 'invalid days';
  end if;

  -- Nur diese Funktion darf die Testfrist veraendern: sie laeuft als
  -- security definer (Tabellen-Eigner) und schaltet den Guard-Trigger
  -- kurz aus und direkt danach wieder ein. Ein SET-Flag waere von aussen
  -- setzbar und damit umgehbar; ein Trigger-Disable nicht. Schlaegt das
  -- Update fehl, stellt der Transaktions-Rollback den Trigger wieder her.
  execute 'alter table public.tenants disable trigger tenants_guard_license';

  update public.tenants t
  set trial_ends_at = greatest(coalesce(t.trial_ends_at, now()), now()) + make_interval(days => days)
  where t.id = tenant and t.plan = 'trial'
  returning t.trial_ends_at into ends;

  -- WICHTIG: DISABLE TRIGGER ist persistent (Katalogaenderung), nicht
  -- transaktionslokal. Ohne Re-Aktivierung bliebe der Guard nach dem
  -- ersten erfolgreichen Aufruf dauerhaft aus. Beim Fehlerfall stellt
  -- der Rollback den Zustand ohnehin wieder her.
  execute 'alter table public.tenants enable trigger tenants_guard_license';

  return ends;
end;
$$;

revoke all on function public.extend_trial(integer) from public, anon;
grant execute on function public.extend_trial(integer) to authenticated;

create or replace function public.guard_tenant_license()
returns trigger
language plpgsql
as $$
begin
  -- Service-Schluessel (Stripe-Webhook) und Tabellen-Eigner (SQL-Editor)
  -- duerfen Lizenzfelder aendern; angemeldete Mandanten-Admins nicht.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;
  if new.plan is distinct from old.plan
     or new.trial_started_at is distinct from old.trial_started_at
     or new.trial_ends_at is distinct from old.trial_ends_at then
    raise exception 'license fields are read-only';
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_guard_license on public.tenants;
create trigger tenants_guard_license
  before update on public.tenants
  for each row execute function public.guard_tenant_license();

-- Kontrolle:
-- Als orgadmin eines Testmandants:
--   update tenants set plan = 'licensed' where id = current_tenant();
--   -> Fehler 'license fields are read-only'
-- Als orgadmin:
--   select extend_trial(7);
--   -> laeuft, Frist verlaengert sich um 7 Tage.
