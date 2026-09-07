-- Facility365 – kostenlose 30-Tage-Testversion
--
-- Jede neue Registrierung erhaelt einen eigenen Mandanten mit Testzeit; die
-- Daten liegen damit von Anfang an getrennt von allen anderen Kunden. Bereits
-- bestehende Mandanten gelten als lizenziert (`plan = 'licensed'`) und laufen
-- ohne Frist unveraendert weiter.

alter table public.tenants add column if not exists plan text not null default 'licensed';
alter table public.tenants add column if not exists trial_started_at timestamptz;
alter table public.tenants add column if not exists trial_ends_at timestamptz;

/** Dauer der kostenlosen Testversion. */
create or replace function public.trial_days()
returns integer
language sql
immutable
as $$ select 30; $$;

/**
 * Neues Konto: Beitritt zum einladenden Mandanten oder eigener Mandant mit
 * Testzeit. Eingeladene Personen arbeiten im bestehenden Mandanten weiter und
 * starten keine zweite Testzeit.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invited public.invitations%rowtype;
  fresh uuid;
begin
  select * into invited from public.invitations where email = lower(new.email);

  if found then
    insert into public.memberships (tenant_id, auth_user_id, role, status)
    values (invited.tenant_id, new.id, invited.role, 'active')
    on conflict do nothing;
    delete from public.invitations where email = invited.email;
  else
    insert into public.tenants (name, plan, trial_started_at, trial_ends_at)
    values (
      coalesce(new.email, ''),
      'trial',
      now(),
      now() + make_interval(days => public.trial_days()))
    returning id into fresh;
    insert into public.memberships (tenant_id, auth_user_id, role, status)
    values (fresh, new.id, 'orgadmin', 'active')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

/**
 * Verlaengerung der Testzeit.
 *
 * Nur die Leitung des eigenen Mandanten darf verlaengern, hoechstens um die
 * Dauer einer Testversion je Aufruf. Eine laufende Testzeit wird angehaengt,
 * eine abgelaufene startet ab heute.
 */
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

  update public.tenants t
  set trial_ends_at = greatest(coalesce(t.trial_ends_at, now()), now()) + make_interval(days => days)
  where t.id = tenant and t.plan = 'trial'
  returning t.trial_ends_at into ends;

  return ends;
end;
$$;

revoke all on function public.extend_trial(integer) from public, anon;
grant execute on function public.extend_trial(integer) to authenticated;
