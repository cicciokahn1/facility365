'use client';

/**
 * Automatische Abmeldung bei Inaktivitaet.
 *
 * Nach IDLE_MS ohne Maus-, Tastatur- oder Touch-Aktivitaet wird die Sitzung
 * beendet und die App zeigt die Login-Seite. Fuer Mehrbenutzer-Geraete
 * (Werkhof, Station) bleibt damit kein fremdes Konto offen.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/provider';

const IDLE_MS = 30 * 60 * 1000;
const EVENTS: (keyof WindowEventMap)[] = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
];

export function IdleLogout() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    let timer = window.setTimeout(logout, IDLE_MS);

    function logout() {
      void signOut().then(() => router.replace('/login'));
    }

    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, IDLE_MS);
    };
    EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      EVENTS.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [user, signOut, router]);

  return null;
}
