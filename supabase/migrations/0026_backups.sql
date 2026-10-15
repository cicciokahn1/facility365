-- Serverseitige Datensicherung.
-- Jede Sicherung gehoert einer Organisation; Mitglieder lesen und schreiben
-- ausschliesslich im eigenen Mandanten.
create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade default public.current_tenant(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists backups_tenant_idx
  on public.backups (tenant_id, created_at desc);

alter table public.backups enable row level security;
alter table public.backups force row level security;

drop policy if exists backups_select_tenant on public.backups;
create policy backups_select_tenant on public.backups
  for select to authenticated
  using (tenant_id = public.current_tenant());

drop policy if exists backups_insert_tenant on public.backups;
create policy backups_insert_tenant on public.backups
  for insert to authenticated
  with check (tenant_id = public.current_tenant());

grant select, insert on public.backups to authenticated;
revoke all on public.backups from anon;
