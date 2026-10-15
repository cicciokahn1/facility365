/**
 * Server-Push aus der laufenden App.
 *
 * POST /api/push/send mit Bearer-Token der angemeldeten Person und
 * { userId, title, body, href, event, tag }. Der Aufrufer muss zur selben
 * Organisation gehoeren; die Einstellungen des Zielbenutzers entscheiden,
 * ob und welche Mitteilung zugestellt wird.
 */
import { NextResponse } from 'next/server';

import { adminClient, deliverPush, tenantOfUser } from '@/lib/push/server';

type Payload = {
  userId?: string;
  title?: string;
  body?: string;
  href?: string;
  event?: string;
  tag?: string;
};

export async function POST(request: Request) {
  const admin = adminClient();
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!admin || !token) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Payload | null;
  const userId = payload?.userId ?? '';
  if (!userId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  if (userId === user.id) return NextResponse.json({ sent: 0, skipped: 'self' });

  /** Nur innerhalb derselben Organisation melden. */
  const [senderTenant, targetTenant] = await Promise.all([
    tenantOfUser(admin, user.id),
    tenantOfUser(admin, userId),
  ]);
  if (!senderTenant || senderTenant !== targetTenant) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const tag = payload?.tag ?? payload?.href ?? 'event';
  const { error: dedupeError } = await admin
    .from('push_sent')
    .insert({ tag, tenant_id: targetTenant });
  if (dedupeError) return NextResponse.json({ sent: 0, skipped: 'duplicate' });

  const sent = await deliverPush(admin, userId, {
    title: (payload?.title ?? 'Facility365').slice(0, 120),
    body: (payload?.body ?? '').slice(0, 500),
    href: payload?.href ?? '/dashboard',
    event: payload?.event ?? '',
    tag,
  });
  return NextResponse.json({ sent });
}
