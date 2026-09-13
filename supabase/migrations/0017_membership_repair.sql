-- Facility365 – Mitgliedschaft zuverlaessig ermitteln
--
-- Die Leseregel auf `memberships` zeigt nur Zeilen des eigenen aktiven
-- Mandanten. Ein Konto ohne Zeile (z. B. angelegt, bevor der Ausloeser
-- `on_auth_user_created` bestand) sah deshalb keine Mitgliedschaft und wurde
-- faelschlich als deaktiviert gemeldet. `my_membership()` liefert die eigene
-- Zeile unabhaengig von der Leseregel und legt fuer Konten ohne jede
-- Mitgliedschaft – wie bei einer Neuregistrierung – einen eigenen Mandanten an.
-- Bewusst deaktivierte Mitgliedschaften bleiben deaktiviert.

create or replace function public.my_membership()
returns table (tenant_id uuid, role text, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  mail text;
  fresh uuid;
begin
  if uid is null then
    return;
  end if;

  if not exists (select 1 from public.memberships m where m.auth_user_id = uid) then
    select u.email into mail from auth.users u where u.id = uid;
    insert into public.tenants (name, plan, trial_started_at, trial_ends_at)
    values (
      coalesce(mail, ''),
      'trial',
      now(),
      now() + make_interval(days => public.trial_days()))
    returning id into fresh;
    insert into public.memberships (tenant_id, auth_user_id, role, status)
    values (fresh, uid, 'orgadmin', 'active')
    on conflict do nothing;
  end if;

  return query
    select m.tenant_id, m.role, m.status
    from public.memberships m
    where m.auth_user_id = uid
    order by (m.status = 'active') desc, m.created_at
    limit 1;
end;
$$;

revoke all on function public.my_membership() from public;
grant execute on function public.my_membership() to authenticated;
