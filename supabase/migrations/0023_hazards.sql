create table if not exists public.hazards (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tenant_id uuid not null default public.current_tenant() references public.tenants(id) on delete cascade,
  number text not null default '',
  data jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, id)
);

create index if not exists hazards_tenant_updated_idx
  on public.hazards (tenant_id, updated_at desc);

alter table public.hazards enable row level security;
alter table public.hazards force row level security;

drop policy if exists hazards_select_tenant on public.hazards;
create policy hazards_select_tenant on public.hazards
  for select to authenticated
  using (tenant_id = public.current_tenant());

drop policy if exists hazards_insert_tenant on public.hazards;
create policy hazards_insert_tenant on public.hazards
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.may_write());

drop policy if exists hazards_update_tenant on public.hazards;
create policy hazards_update_tenant on public.hazards
  for update to authenticated
  using (tenant_id = public.current_tenant() and public.may_write())
  with check (tenant_id = public.current_tenant());

drop policy if exists hazards_delete_tenant on public.hazards;
create policy hazards_delete_tenant on public.hazards
  for delete to authenticated
  using (tenant_id = public.current_tenant() and public.may_delete());

grant select, insert, update, delete on public.hazards to authenticated;
revoke all on public.hazards from anon;
