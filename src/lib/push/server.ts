/**
 * Serverseitige Push-Zustellung (nur API-Routen).
 *
 * Liest Abonnements und Benutzereinstellungen mit dem Service-Schluessel,
 * filtert abgeschaltete Ereignisse und entfernt abgelaufene Abonnements.
 */
import webpush from 'web-push';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface PushContent {
  title: string;
  body: string;
  href: string;
  event: string;
  tag: string;
}

export const adminClient = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const deliverPush = async (
  admin: SupabaseClient,
  userId: string,
  content: PushContent,
): Promise<number> => {
  const { data: settings } = await admin
    .from('settings')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  const settingsData = settings?.data;
  if (
    settingsData &&
    typeof settingsData === 'object' &&
    (settingsData as Record<string, unknown>).notificationsEnabled === false
  ) {
    return 0;
  }
  const events =
    settingsData && typeof settingsData === 'object'
      ? ((settingsData as Record<string, unknown>).notificationEvents as
          | Record<string, unknown>
          | undefined)
      : undefined;
  if (content.event && events && events[content.event] === false) return 0;

  const privateKey = process.env.FACILITY365_VAPID_PRIVATE_KEY ?? '';
  if (!privateKey) return 0;
  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (!subscriptions?.length) return 0;

  webpush.setVapidDetails(
    process.env.FACILITY365_VAPID_SUBJECT ?? 'mailto:admin@facility365.ch',
    'BMFOcMBnET9KD0-_-Kl3E2OwkUc0EzvHdpQ-t7C1Mv9L_tBWtxuKv79znoqFImTUwJ_wFif-Qq4aKeoNiCuAUmA',
    privateKey,
  );

  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: content.title,
          body: content.body,
          href: content.href,
          tag: content.tag,
        }),
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
  return sent;
};

export const tenantOfUser = async (
  admin: SupabaseClient,
  authUserId: string,
): Promise<string> => {
  const { data } = await admin
    .from('memberships')
    .select('tenant_id')
    .eq('auth_user_id', authUserId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return (data?.tenant_id as string | undefined) ?? '';
};
