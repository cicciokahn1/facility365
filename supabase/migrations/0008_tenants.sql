-- Facility365 – Mandantentrennung, Rollenpruefung und Papierkorb
--
-- Bisher gehoerte jede Zeile genau einem Anmeldekonto. Fuer den Betrieb mit
-- mehreren Personen je Kunde gehoert eine Zeile neu einem Mandanten
-- (`tenants`); wer dazu gehoert und mit welcher Rolle, steht in
-- `memberships`. Die Regeln der Datenbank pruefen ab jetzt Mandant, Rolle und
-- Zustand des Kontos - unabhaengig davon, was die Oberflaeche sendet.
--
-- Bestehende Daten bleiben vollstaendig erhalten: jedes bisherige Konto wird
-- zu einem eigenen Mandanten, seine Zeilen werden diesem Mandanten
-- zugeordnet, und `user_id` bleibt als Urheber bestehen.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'orgadmin',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  primary key (tenant_id, auth_user_id)
);

-- Ein Konto gehoert zu genau einem Mandanten.
create unique index if not exists memberships_user_idx on public.memberships (auth_user_id);

-- Einladung: wer eingeladen wurde, landet bei der Anmeldung im richtigen Mandanten.
create table if not exists public.invitations (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email text not null,
  role text not null default 'reader',
  created_at timestamptz not null default now(),
  primary key (email)
);

/**
 * Mandant, Rolle und Zustand des angemeldeten Kontos.
 *
 * `security definer` ist noetig, damit die Regeln der Sammlungen die
 * Mitgliedschaft lesen duerfen, ohne dass ein Konto die Tabelle selbst
 * durchsuchen kann.
 */
create or replace function public.current_tenant()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.tenant_id
  from public.memberships m
  where m.auth_user_id = auth.uid() and m.status = 'active'
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
  where m.auth_user_id = auth.uid() and m.status = 'active'
  limit 1;
$$;

/** Leser und deaktivierte Konten duerfen nichts schreiben. */
create or replace function public.may_write()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role_name() <> 'reader', false);
$$;

/** Loeschen bleibt der Leitung vorbehalten. */
create or replace function public.may_delete()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_role_name() in ('superadmin', 'orgadmin', 'sitemanager'),
    false);
$$;

-- Bestehende Konten werden zu Mandanten; vorhandene Mitgliedschaften bleiben.
do $$
declare
  account record;
  fresh uuid;
begin
  for account in
    select u.id, u.email from auth.users u
    where not exists (select 1 from public.memberships m where m.auth_user_id = u.id)
  loop
    insert into public.tenants (name) values (coalesce(account.email, '')) returning id into fresh;
    insert into public.memberships (tenant_id, auth_user_id, role, status)
    values (fresh, account.id, 'orgadmin', 'active')
    on conflict do nothing;
  end loop;
end;
$$;

/**
 * Jede Sammlung bekommt den Mandanten, einen Papierkorb-Zeitstempel und neue
 * Regeln. Die Schleife laeuft ueber alle vorhandenen Sammlungstabellen, damit
 * kein Modul vergessen wird.
 */
do $$
declare
  collection text;
begin
  for collection in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'user_id'
      and c.table_name <> 'settings'
      and exists (
        select 1 from information_schema.columns d
        where d.table_schema = 'public' and d.table_name = c.table_name and d.column_name = 'data')
  loop
    execute format('alter table public.%I add column if not exists tenant_id uuid references public.tenants (id) on delete cascade;', collection);
    execute format('alter table public.%I add column if not exists deleted_at timestamptz;', collection);

    execute format(
      'update public.%I t set tenant_id = m.tenant_id from public.memberships m where m.auth_user_id = t.user_id and t.tenant_id is null;',
      collection);

    -- Zeilen ohne Konto bleiben erhalten; sie erhalten keinen Mandanten und sind damit unsichtbar, aber nicht geloescht.
    execute format('alter table public.%I alter column tenant_id set default public.current_tenant();', collection);

    -- Schluessel und Nummernkreis gelten neu je Mandant.
    execute format('alter table public.%I drop constraint if exists %I;', collection, collection || '_pkey');
    execute format('alter table public.%I alter column user_id drop not null;', collection);
    execute format('alter table public.%I alter column user_id set default auth.uid();', collection);
    execute format('drop index if exists public.%I;', collection || '_user_number_idx');
    execute format('create unique index if not exists %I on public.%I (tenant_id, id);', collection || '_tenant_id_idx', collection);
    execute format(
      'create unique index if not exists %I on public.%I (tenant_id, number) where number <> '''';',
      collection || '_tenant_number_idx', collection);
    execute format(
      'create index if not exists %I on public.%I (tenant_id, updated_at desc);',
      collection || '_tenant_updated_idx', collection);

    execute format('alter table public.%I enable row level security;', collection);
    execute format('alter table public.%I force row level security;', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_select_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_insert_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_update_own', collection);
    execute format('drop policy if exists %I on public.%I;', collection || '_delete_own', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_select_tenant', collection);
    execute format(
      'create policy %I on public.%I for select to authenticated using (tenant_id = public.current_tenant());',
      collection || '_select_tenant', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_insert_tenant', collection);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (tenant_id = public.current_tenant() and public.may_write());',
      collection || '_insert_tenant', collection);

    if collection = 'activities' then
      -- Die Aenderungshistorie bleibt unveraenderbar: kein Update, kein Delete.
      execute format('grant select, insert on public.%I to authenticated;', collection);
      execute format('revoke update, delete on public.%I from authenticated;', collection);
    else
      execute format('drop policy if exists %I on public.%I;', collection || '_update_tenant', collection);
      execute format(
        'create policy %I on public.%I for update to authenticated using (tenant_id = public.current_tenant() and public.may_write()) with check (tenant_id = public.current_tenant() and public.may_write());',
        collection || '_update_tenant', collection);

      execute format('drop policy if exists %I on public.%I;', collection || '_delete_tenant', collection);
      execute format(
        'create policy %I on public.%I for delete to authenticated using (tenant_id = public.current_tenant() and public.may_delete());',
        collection || '_delete_tenant', collection);

      execute format('grant select, insert, update, delete on public.%I to authenticated;', collection);
    end if;

    execute format('revoke all on public.%I from anon;', collection);
  end loop;
end;
$$;

-- Mandant und Mitgliedschaften lesen: alle Mitglieder; aendern: nur die Leitung.
alter table public.tenants enable row level security;
alter table public.tenants force row level security;

drop policy if exists tenants_select_own on public.tenants;
create policy tenants_select_own on public.tenants
  for select to authenticated using (id = public.current_tenant());

drop policy if exists tenants_update_admin on public.tenants;
create policy tenants_update_admin on public.tenants
  for update to authenticated
  using (id = public.current_tenant() and public.current_role_name() in ('superadmin', 'orgadmin'))
  with check (id = public.current_tenant());

grant select, update on public.tenants to authenticated;
revoke all on public.tenants from anon;

alter table public.memberships enable row level security;
alter table public.memberships force row level security;

drop policy if exists memberships_select_tenant on public.memberships;
create policy memberships_select_tenant on public.memberships
  for select to authenticated using (tenant_id = public.current_tenant());

drop policy if exists memberships_write_admin on public.memberships;
create policy memberships_write_admin on public.memberships
  for update to authenticated
  using (tenant_id = public.current_tenant() and public.current_role_name() in ('superadmin', 'orgadmin'))
  with check (tenant_id = public.current_tenant());

grant select, update on public.memberships to authenticated;
revoke all on public.memberships from anon;

alter table public.invitations enable row level security;
alter table public.invitations force row level security;

drop policy if exists invitations_select_tenant on public.invitations;
create policy invitations_select_tenant on public.invitations
  for select to authenticated using (tenant_id = public.current_tenant());

drop policy if exists invitations_insert_admin on public.invitations;
create policy invitations_insert_admin on public.invitations
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.current_role_name() in ('superadmin', 'orgadmin'));

drop policy if exists invitations_delete_admin on public.invitations;
create policy invitations_delete_admin on public.invitations
  for delete to authenticated
  using (tenant_id = public.current_tenant() and public.current_role_name() in ('superadmin', 'orgadmin'));

grant select, insert, delete on public.invitations to authenticated;
revoke all on public.invitations from anon;

/**
 * Sicherungen je Mandant.
 *
 * Die Anwendung legt taeglich eine Sicherung ab und haelt die letzten
 * Staende vor; wiederhergestellt wird daraus auf Wunsch.
 */
create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant() references public.tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index if not exists backups_tenant_created_idx on public.backups (tenant_id, created_at desc);

alter table public.backups enable row level security;
alter table public.backups force row level security;

drop policy if exists backups_select_tenant on public.backups;
create policy backups_select_tenant on public.backups
  for select to authenticated using (tenant_id = public.current_tenant());

drop policy if exists backups_insert_tenant on public.backups;
create policy backups_insert_tenant on public.backups
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.may_write());

drop policy if exists backups_delete_admin on public.backups;
create policy backups_delete_admin on public.backups
  for delete to authenticated
  using (tenant_id = public.current_tenant() and public.may_delete());

grant select, insert, delete on public.backups to authenticated;
revoke all on public.backups from anon;

/**
 * Neues Konto: entweder Beitritt zum einladenden Mandanten oder ein eigener
 * Mandant. So sieht niemand fremde Daten, ohne eingeladen worden zu sein.
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
    insert into public.tenants (name) values (coalesce(new.email, '')) returning id into fresh;
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
