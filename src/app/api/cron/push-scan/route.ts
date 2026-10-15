/**
 * Geplanter Server-Push (Vercel Cron, taeglich).
 *
 * Prueft fällige und ueberfaellige Wartungen sowie Kontrollen und meldet
 * die zuständige Person - auch wenn niemand die App geoeffnet hat.
 * Jede Faelligkeit wird genau einmal gemeldet (push_sent-Dedupe).
 */
import { NextResponse } from 'next/server';

import { adminClient, deliverPush } from '@/lib/push/server';

const COLLECTIONS = [
  { table: 'maintenances', href: 'maintenances', event: 'maintenance' },
  { table: 'inspections', href: 'inspections', event: 'maintenance' },
  { table: 'firechecks', href: 'firesafety', event: 'maintenance' },
  { table: 'playgroundchecks', href: 'playgrounds', event: 'maintenance' },
] as const;

interface EntityRow {
  id: string;
  tenant_id: string;
  data: {
    title?: string;
    number?: string;
    status?: string;
    nextDate?: string;
    assigneeUserId?: string;
  };
}

export async function GET(request: Request) {
  /** Nur der Vercel-Cron-Aufruf darf den Scan starten. */
  const cronSecret = process.env.CRON_SECRET ?? '';
  const authorization = request.headers.get('authorization') ?? '';
  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  /** Benutzer-ID der App auf die Anmelde-Kennung abbilden. */
  const { data: users } = await admin.from('users').select('id, tenant_id, data');
  const externalOf = new Map<string, string>();
  const managersByTenant = new Map<string, string[]>();
  for (const row of users ?? []) {
    const data = row.data as { externalId?: string; role?: string; status?: string };
    const external = data?.externalId;
    if (!external) continue;
    externalOf.set(row.id as string, external);
    if (
      ['superadmin', 'orgadmin', 'sitemanager'].includes(data.role ?? '') &&
      data.status !== 'inactive'
    ) {
      const list = managersByTenant.get(row.tenant_id as string) ?? [];
      list.push(external);
      managersByTenant.set(row.tenant_id as string, list);
    }
  }

  let scanned = 0;
  let notified = 0;
  for (const entry of COLLECTIONS) {
    const { data: rows } = await admin
      .from(entry.table)
      .select('id, tenant_id, data')
      .lte('data->>nextDate', soon)
      .is('deleted_at', null);
    for (const row of (rows ?? []) as EntityRow[]) {
      const data = row.data ?? {};
      const nextDate = (data.nextDate ?? '').slice(0, 10);
      const assignee = data.assigneeUserId ?? '';
      if (!nextDate || nextDate > soon || !assignee || data.status === 'done') continue;
      scanned += 1;
      const authId = externalOf.get(assignee);
      if (!authId) continue;
      const overdue = nextDate < today;
      const tag = `cron-${entry.table}-${row.id}-${nextDate}`;
      const { error: dedupeError } = await admin
        .from('push_sent')
        .insert({ tag, tenant_id: row.tenant_id });
      if (dedupeError) continue;
      notified += await deliverPush(admin, authId, {
        title: overdue
          ? `Überfällig: ${data.number ?? ''}`
          : `Fällig: ${data.number ?? ''}`,
        body: `${data.title ?? ''} – ${nextDate}`,
        href: `/${entry.href}/${row.id}`,
        event: entry.event,
        tag,
      });
    }
  }
  /** Dokument-Fristen: abgelaufen oder in 30 Tagen faellig -> Leitung melden. */
  const docSoon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const { data: docs } = await admin
    .from('documents')
    .select('id, tenant_id, data')
    .is('deleted_at', null);
  for (const row of docs ?? []) {
    const data = (row.data ?? {}) as { title?: string; validUntil?: string; number?: string };
    const validUntil = (data.validUntil ?? '').slice(0, 10);
    if (!validUntil || validUntil > docSoon) continue;
    const targets = managersByTenant.get(row.tenant_id as string) ?? [];
    const tag = `cron-doc-${row.id}-${validUntil}`;
    const { error: dedupeError } = await admin
      .from('push_sent')
      .insert({ tag, tenant_id: row.tenant_id });
    if (dedupeError) continue;
    scanned += 1;
    for (const authId of targets) {
      notified += await deliverPush(admin, authId, {
        title: `Dokument ${validUntil < today ? 'abgelaufen' : 'läuft ab'}: ${data.number ?? ''}`,
        body: `${data.title ?? ''} – ${validUntil}`,
        href: `/documents/${row.id}`,
        event: 'maintenance',
        tag,
      });
    }
  }

  return NextResponse.json({ scanned, notified });
}
