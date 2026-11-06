'use client';

/**
 * Automatische Abmeldung bei Inaktivitaet.
 *
 * Nach IDLE_MS ohne Maus-, Tastatur- oder Touch-Aktivitaet wird die Sitzung
 * beendet und die App zeigt die Login-Seite. Fuer Mehrbenutzer-Geraete
 * (Werkhof, Station) bleibt damit kein fremdes Konto offen.
 *
 * Geprueft wird anhand eines Zeitstempels, nicht nur ueber den Timer:
 * Im Hintergrund (gesperrtes Handy, inaktiver Tab) duerfen Timer schlafen;
 * beim Zurueckkommen wird die verstrichene Zeit trotzdem korrekt erkannt.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/provider';

const IDLE_MS = 30 * 60 * 1000;
const CHECK_MS = 60 * 1000;
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
    let lastActivity = Date.now();
    let loggingOut = false;

    const logout = () => {
      if (loggingOut) return;
      loggingOut = true;
      void signOut().then(() => router.replace('/login'));
    };

    const check = () => {
      if (Date.now() - lastActivity >= IDLE_MS) logout();
    };

    const reset = () => {
      lastActivity = Date.now();
    };

    EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    const interval = window.setInterval(check, CHECK_MS);
    return () => {
      EVENTS.forEach((event) => window.removeEventListener(event, reset));
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      window.clearInterval(interval);
    };
  }, [user, signOut, router]);

  return null;
}
