-- Facility365 – Spielplatzkontrollen
--
-- Eine zusaetzliche Sammlung: Spielplatzkontrollen (`playgroundchecks`).
-- Aufbau, Mandant und Regeln entsprechen den
-- bestehenden Sammlungen; vorhandene Daten bleiben unveraendert.

do $$
declare
  collection text;
begin
  foreach collection in array array['playgroundchecks']
  loop
    execute format($fmt$
      create table if not exists public.%I (
        id text not null,
        tenant_id uuid not null default public.current_tenant() references public.tenants (id) on delete cascade,
        user_id uuid default auth.uid() references auth.users (id) on delete set null,
        number text not null default '',
        data jsonb not null default '{}'::jsonb,
        deleted_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );$fmt$, collection);

    execute format('create unique index if not exists %I on public.%I (tenant_id, id);',
      collection || '_tenant_id_idx', collection);
    execute format(
      'create unique index if not exists %I on public.%I (tenant_id, number) where number <> '''';',
      collection || '_tenant_number_idx', collection);
    execute format('create index if not exists %I on public.%I (tenant_id, updated_at desc);',
      collection || '_tenant_updated_idx', collection);

    execute format('alter table public.%I enable row level security;', collection);
    execute format('alter table public.%I force row level security;', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_select_tenant', collection);
    execute format(
      'create policy %I on public.%I for select to authenticated using (tenant_id = public.current_tenant());',
      collection || '_select_tenant', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_insert_tenant', collection);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (tenant_id = public.current_tenant() and public.may_write());',
      collection || '_insert_tenant', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_update_tenant', collection);
    execute format(
      'create policy %I on public.%I for update to authenticated using (tenant_id = public.current_tenant() and public.may_write()) with check (tenant_id = public.current_tenant() and public.may_write());',
      collection || '_update_tenant', collection);

    execute format('drop policy if exists %I on public.%I;', collection || '_delete_tenant', collection);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (tenant_id = public.current_tenant() and public.may_delete());',
      collection || '_delete_tenant', collection);

    execute format('grant select, insert, update, delete on public.%I to authenticated;', collection);
    execute format('revoke all on public.%I from anon;', collection);

    execute format('drop trigger if exists %I on public.%I;', collection || '_touch_updated_at', collection);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at();',
      collection || '_touch_updated_at', collection);
  end loop;
end;
$$;
