-- Facility365 – Datentrennung je Benutzer
--
-- Jede Sammlung der Anwendung wird eine eigene Tabelle. Jede Zeile gehoert
-- genau einem angemeldeten Benutzer: `user_id` verweist auf `auth.users` und
-- wird von der Datenbank selbst aus `auth.uid()` gesetzt, damit ein Client die
-- Zugehoerigkeit nicht faelschen kann.
--
-- Die fachlichen Felder liegen als `data` (jsonb). Das haelt Schema und
-- Anwendung deckungsgleich, ohne die verschachtelten Strukturen (Fotos,
-- Checklisten, Positionen, Plaene) in Dutzende Tabellen zu zerlegen. Gefiltert
-- und sortiert wird ueber die ausgelagerten Spalten `number`, `created_at` und
-- `updated_at`.

create extension if not exists pgcrypto;

do $$
declare
  collection text;
  collections text[] := array[
    'customers', 'suppliers', 'properties', 'buildings', 'rooms', 'assets', 'documents', 'energy',
    'orders', 'maintenances', 'legionella', 'rcd', 'keys', 'stock', 'contracts', 'damages', 'reports', 'quotes', 'invoices'
  ];
begin
  foreach collection in array collections loop
    execute format($ddl$
      create table if not exists public.%I (
        id text not null,
        user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
        number text not null default '',
        data jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        primary key (user_id, id)
      );
    $ddl$, collection);

    -- Lesbare Nummern sind je Benutzer eindeutig, nicht ueber alle Benutzer.
    execute format(
      'create unique index if not exists %I on public.%I (user_id, number) where number <> '''';',
      collection || '_user_number_idx', collection);

    execute format(
      'create index if not exists %I on public.%I (user_id, updated_at desc);',
      collection || '_user_updated_idx', collection);

    execute format('alter table public.%I enable row level security;', collection);
    execute format('alter table public.%I force row level security;', collection);

    -- Vier Regeln je Tabelle: lesen, erstellen, aendern, loeschen - jeweils nur
    -- eigene Zeilen. `with check` verhindert zusaetzlich, dass ein Datensatz
    -- einem fremden Benutzer untergeschoben oder weitergereicht wird.
    execute format('drop policy if exists %I on public.%I;', collection || '_select_own', collection);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id);',
      collection || '_select_own', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_insert_own', collection);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id);',
      collection || '_insert_own', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_update_own', collection);
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      collection || '_update_own', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_delete_own', collection);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id);',
      collection || '_delete_own', collection);

    execute format('grant select, insert, update, delete on public.%I to authenticated;', collection);
    execute format('revoke all on public.%I from anon;', collection);
  end loop;
end;
$$;

-- Einstellungen: genau ein Datensatz je Benutzer.
create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
alter table public.settings force row level security;

drop policy if exists settings_select_own on public.settings;
create policy settings_select_own on public.settings
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists settings_insert_own on public.settings;
create policy settings_insert_own on public.settings
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists settings_update_own on public.settings;
create policy settings_update_own on public.settings
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists settings_delete_own on public.settings;
create policy settings_delete_own on public.settings
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.settings to authenticated;
revoke all on public.settings from anon;

-- `updated_at` fortschreiben, unabhaengig davon, was der Client sendet.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  target text;
  targets text[] := array[
    'customers', 'suppliers', 'properties', 'buildings', 'rooms', 'assets', 'documents', 'energy',
    'orders', 'maintenances', 'legionella', 'rcd', 'keys', 'stock', 'contracts', 'damages', 'reports', 'quotes', 'invoices', 'settings'
  ];
begin
  foreach target in array targets loop
    execute format('drop trigger if exists %I on public.%I;', target || '_touch_updated_at', target);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at();',
      target || '_touch_updated_at', target);
  end loop;
end;
$$;
