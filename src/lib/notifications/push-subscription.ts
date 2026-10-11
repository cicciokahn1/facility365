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

/** Push auf diesem Geraet abmelden - beim Browser und beim Server. */
export async function unregisterPushSubscription(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    const client = await supabase();
    const token = client ? (await client.auth.getSession()).data.session?.access_token : '';
    if (!token) return;
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    /* Ohne Verbindung bleibt der Eintrag; der Server entfernt ihn beim naechsten Versand. */
  }
}
