'use client';

/**
 * Erinnerungen im Hintergrund.
 *
 * Der Baustein wird erst nach dem ersten Bildaufbau geladen, damit Start und
 * Navigation nicht auf Kalender- und Objektdaten warten muessen.
 */
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Reminders = dynamic(
  () => import('@/components/layout/reminders').then((module) => module.Reminders),
  { ssr: false },
);

interface IdleWindow {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
}

export function DeferredReminders() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => setReady(true);
    const idle = (window as unknown as IdleWindow).requestIdleCallback;
    if (idle) {
      idle(start, { timeout: 5000 });
      return;
    }
    const timer = window.setTimeout(start, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? <Reminders /> : null;
}
