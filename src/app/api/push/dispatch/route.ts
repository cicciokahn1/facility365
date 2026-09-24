import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

type DispatchPayload = {
  userId?: string;
  title?: string;
  body?: string;
  href?: string;
};

const adminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export async function POST(request: Request) {
  const apiKey = process.env.FACILITY365_API_KEY ?? '';
  if (!apiKey || request.headers.get('x-api-key') !== apiKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const privateKey = process.env.FACILITY365_VAPID_PRIVATE_KEY ?? '';
  if (!privateKey) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const payload = (await request.json().catch(() => null)) as DispatchPayload | null;
  const userId = payload?.userId ?? '';
  const title = payload?.title ?? 'Facility365';
  const body = payload?.body ?? '';
  const href = payload?.href ?? '/dashboard';
  if (!userId) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { data: settings } = await admin
    .from('settings')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  const settingsData = settings?.data;
  if (
    settingsData &&
    typeof settingsData === 'object' &&
    'notificationsEnabled' in settingsData &&
    settingsData.notificationsEnabled === false
  ) {
    return NextResponse.json({ sent: 0, skipped: 'disabled' });
  }

  const { data: subscriptions, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: 'load_failed' }, { status: 500 });

  webpush.setVapidDetails(
    process.env.FACILITY365_VAPID_SUBJECT ?? 'mailto:admin@facility365.ch',
    'BCkKSxerlEO2joT2TYXSDa31tKuJRl3SZpxLhQAdwQI7222BbBVHHGlVE4qyQsiqQevMvb-z5ubflTejBEjk0QU',
    privateKey,
  );

  let sent = 0;
  for (const subscription of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({ title, body, href }),
      );
      sent += 1;
    } catch (sendError) {
      const statusCode =
        typeof sendError === 'object' &&
        sendError !== null &&
        'statusCode' in sendError &&
        typeof sendError.statusCode === 'number'
          ? sendError.statusCode
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', subscription.id);
      }
    }
  }

  return NextResponse.json({ sent });
}
