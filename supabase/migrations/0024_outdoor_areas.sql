create table if not exists public.outdoorareas (
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

create index if not exists outdoorareas_tenant_updated_idx
  on public.outdoorareas (tenant_id, updated_at desc);

alter table public.outdoorareas enable row level security;
alter table public.outdoorareas force row level security;

drop policy if exists outdoorareas_select_tenant on public.outdoorareas;
create policy outdoorareas_select_tenant on public.outdoorareas
  for select to authenticated using (tenant_id = public.current_tenant());

drop policy if exists outdoorareas_insert_tenant on public.outdoorareas;
create policy outdoorareas_insert_tenant on public.outdoorareas
  for insert to authenticated
  with check (tenant_id = public.current_tenant() and public.may_write());

drop policy if exists outdoorareas_update_tenant on public.outdoorareas;
create policy outdoorareas_update_tenant on public.outdoorareas
  for update to authenticated
  using (tenant_id = public.current_tenant() and public.may_write())
  with check (tenant_id = public.current_tenant());

drop policy if exists outdoorareas_delete_tenant on public.outdoorareas;
create policy outdoorareas_delete_tenant on public.outdoorareas
  for delete to authenticated
  using (tenant_id = public.current_tenant() and public.may_delete());

grant select, insert, update, delete on public.outdoorareas to authenticated;
revoke all on public.outdoorareas from anon;
