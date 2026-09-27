'use client';

import { supabase } from '@/lib/supabase/client';
import { base64ToArrayBuffer, VAPID_PUBLIC_KEY } from '@/lib/notifications/push-config';

export async function registerPushSubscription(): Promise<boolean> {
  if (typeof window === 'undefined' || !('PushManager' in window)) return false;
  try {
    const client = await supabase();
    if (!client) return false;
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session?.access_token) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToArrayBuffer(VAPID_PUBLIC_KEY),
      }));

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });
    return response.ok;
  } catch {
    return false;
  }
}
