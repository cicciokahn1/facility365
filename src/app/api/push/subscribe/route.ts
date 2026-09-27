import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const authorization = request.headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!url || !serviceKey || !token) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const endpoint = text(payload?.endpoint);
  const keys = payload?.keys as Record<string, unknown> | undefined;
  const p256dh = text(keys?.p256dh);
  const auth = text(keys?.auth);
  if (
    !endpoint ||
    !p256dh ||
    !auth ||
    endpoint.length > 2048 ||
    p256dh.length > 512 ||
    auth.length > 512
  ) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await admin
    .from('memberships')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) {
    return NextResponse.json({ error: 'no_membership' }, { status: 403 });
  }

  const { error } = await admin.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh,
      auth,
      user_id: user.id,
      tenant_id: membership.tenant_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
