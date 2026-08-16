'use client';

/**
 * Erinnerungen fuer faellige Wartungen, anstehende Auftraege und Termine.
 *
 * Die Meldung erzeugt das Dienstprogramm des Browsers, damit sie auf dem
 * Telefon wie eine Mitteilung des Systems erscheint - auf dem iPhone
 * allerdings erst, wenn Facility365 ueber „Zum Home-Bildschirm“ installiert
 * ist. Jede Erinnerung wird pro Tag nur einmal gezeigt.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { CalendarEvent } from '@/lib/calendar/events';

const SEEN_KEY = 'facility365.v2.notified';
/** Erneute Pruefung, solange die App offen bleibt. */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export type PushPermission = 'unsupported' | 'default' | 'granted' | 'denied';

/** Der Browser meldet keine Aenderung der Erlaubnis; es gibt nichts zu abonnieren. */
const subscribe = () => () => undefined;

export const notificationsSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export const currentPermission = (): PushPermission =>
  notificationsSupported() ? (Notification.permission as PushPermission) : 'unsupported';

/**
 * Auf dem iPhone gibt es Mitteilungen nur in der installierten App.
 * Der Hinweis dazu ist ehrlicher als eine Erlaubnisfrage, die nichts bewirkt.
 */
export const needsInstall = (): boolean => {
  if (typeof window === 'undefined') return false;
  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iOS && !standalone;
};

const seen = (): string[] => {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const remember = (keys: string[]) => {
  try {
    /** Nur die letzten Eintraege behalten; alte Tage sind bedeutungslos. */
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(keys.slice(-200)));
  } catch {
    /* Speicher voll oder gesperrt: die Meldung erscheint dann erneut. */
  }
};

export const show = async (title: string, body: string, href: string): Promise<boolean> => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: href,
    data: { href },
  });
  return true;
};

/** Erlaubnis anfragen; ohne Unterstuetzung bleibt es beim Hinweis. */
export function usePushPermission(): {
  permission: PushPermission;
  install: boolean;
  request: () => Promise<PushPermission>;
} {
  /** Die Erlaubnis lebt im Browser; der Zaehler stoesst das Neuzeichnen an. */
  const [version, setVersion] = useState(0);
  const permission = useSyncExternalStore(
    subscribe,
    () => `${version}|${currentPermission()}`,
    () => '0|unsupported',
  ).split('|')[1] as PushPermission;

  const request = useCallback(async () => {
    if (!notificationsSupported()) return 'unsupported' as const;
    const result = (await Notification.requestPermission()) as PushPermission;
    setVersion((current) => current + 1);
    return result;
  }, []);

  const install = useSyncExternalStore(
    subscribe,
    () => needsInstall(),
    () => false,
  );

  return { permission, install, request };
}

export interface ReminderTexts {
  /** „Heute fällig“ bzw. die Entsprechung der eingestellten Sprache. */
  dueToday: string;
  overdue: string;
}

/** Meldungstext eines Termins: „Heute fällig: Heizungswartung – Gebäude A“. */
export const reminderText = (
  event: CalendarEvent,
  place: string,
  texts: ReminderTexts,
  todayIso: string,
): { title: string; body: string } => ({
  title: `${event.date < todayIso ? texts.overdue : texts.dueToday}: ${event.title}${
    place ? ` – ${place}` : ''
  }`,
  body: place ? `${event.title} – ${place}` : event.title,
});

/**
 * Zeigt die Erinnerungen des Tages.
 *
 * `pending` liefert die faelligen Termine samt Ort; der Aufrufer kennt die
 * Sprache und die Bezeichnungen der Objekte.
 */
export function useDueReminders(
  enabled: boolean,
  pending: () => { key: string; title: string; body: string; href: string }[],
): void {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const run = async () => {
      if (cancelled || currentPermission() !== 'granted') return;
      const already = seen();
      const fresh = pending().filter((entry) => !already.includes(entry.key));
      if (fresh.length === 0) return;
      for (const entry of fresh) {
        await show(entry.title, entry.body, entry.href);
      }
      remember([...already, ...fresh.map((entry) => entry.key)]);
    };

    void run();
    const timer = window.setInterval(() => void run(), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, pending]);
}
