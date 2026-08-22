'use client';

/**
 * Kalender.
 *
 * Monatsraster mit den Terminen aus Auftraegen und Wartungen, darunter die
 * Liste des gewaehlten Tages und die naechsten Termine. Eigene Daten fuehrt
 * der Kalender nicht.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Droplets,
  FileSignature,
  type LucideIcon,
  Repeat,
  SprayCan,
  Wrench,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { CalendarEvent, CalendarEventKind, useCalendarEvents } from '@/lib/calendar/events';
import { useEntityIndex } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { usePushPermission } from '@/lib/notifications/reminders';
import { useSettings } from '@/lib/settings/provider';
import { cn } from '@/lib/utils';
import { formatDate, today } from '@/lib/utils/format';

const WEEKDAY_KEYS = [
  'calendar.mon',
  'calendar.tue',
  'calendar.wed',
  'calendar.thu',
  'calendar.fri',
  'calendar.sat',
  'calendar.sun',
] as const;

/** Symbol je Terminart. */
const EVENT_ICONS: Record<CalendarEventKind, LucideIcon> = {
  order: ClipboardList,
  maintenance: Wrench,
  legionella: Droplets,
  rcd: Zap,
  contract: FileSignature,
  cleaning: SprayCan,
};

const iso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Sechs Wochen ab Montag, damit das Raster nicht springt. */
const gridOf = (year: number, month: number): string[] => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return iso(day);
  });
};

export function CalendarView() {
  const t = useT();
  const { settings } = useSettings();
  const events = useCalendarEvents();
  const push = usePushPermission();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState(today());

  const days = useMemo(() => gridOf(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Intl.DateTimeFormat(
    { de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en-CH' }[settings.language],
    { month: 'long', year: 'numeric' },
  ).format(new Date(cursor.year, cursor.month, 1));

  /** Termine einmal nach Tag gruppieren statt je Rasterfeld zu durchsuchen. */
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    });
    return map;
  }, [events]);

  const upcoming = useMemo(
    () => events.filter((event) => event.date >= today()).slice(0, 12),
    [events],
  );
  const dayEvents = byDay.get(selected) ?? [];

  const step = (delta: number) =>
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('module.calendar')}</h1>
          <p className="text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
        <Button
          size="sm"
          variant={push.permission === 'granted' ? 'outline' : 'default'}
          onClick={async () => {
            if (push.install) {
              toast.info(t('notify.installTitle'), { description: t('notify.installHint') });
              return;
            }
            const result = await push.request();
            if (result === 'granted') toast.success(t('notify.enabled'));
            else if (result === 'denied') toast.error(t('notify.denied'));
            else toast.info(t('notify.unsupported'));
          }}
          data-testid="notifications-enable"
        >
          {push.permission === 'granted' ? (
            <BellRing className="size-4" aria-hidden />
          ) : (
            <Bell className="size-4" aria-hidden />
          )}
          {push.permission === 'granted' ? t('notify.active') : t('notify.enable')}
        </Button>
      </header>

      {push.install ? (
        <p className="rounded-xl border bg-card p-3 text-sm text-muted-foreground" data-testid="notify-install-hint">
          {t('notify.installHint')}
        </p>
      ) : null}

      <section className="rounded-xl border bg-card p-3" data-testid="calendar-grid">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={() => step(-1)} aria-label={t('calendar.previous')} data-testid="calendar-prev">
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <span className="text-sm font-semibold" data-testid="calendar-month">
            {monthLabel}
          </span>
          <Button variant="ghost" size="icon" onClick={() => step(1)} aria-label={t('calendar.next')} data-testid="calendar-next">
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const count = byDay.get(day)?.length ?? 0;
            const inMonth = Number(day.slice(5, 7)) === cursor.month + 1;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                data-testid="calendar-day"
                data-day={day}
                data-count={count}
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors',
                  inMonth ? 'bg-background' : 'bg-muted/40 text-muted-foreground',
                  day === today() && 'border-primary',
                  day === selected && 'ring-2 ring-primary',
                )}
              >
                <span>{Number(day.slice(8, 10))}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section data-testid="calendar-day-list">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {formatDate(selected, settings.language)}
        </h2>
        {dayEvents.length === 0 ? (
          <EmptyState titleKey="calendar.noEvents" />
        ) : (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>

      <section data-testid="calendar-upcoming">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('calendar.upcoming')}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState titleKey="calendar.noEvents" />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} showDate />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventRow({ event, showDate = false }: { event: CalendarEvent; showDate?: boolean }) {
  const t = useT();
  const { settings } = useSettings();
  const customers = useEntityIndex('customers');
  const properties = useEntityIndex('properties');
  const buildings = useEntityIndex('buildings');
  const assets = useEntityIndex('assets');

  const context = [
    customers.get(event.customerId)?.name,
    properties.get(event.propertyId)?.name,
    buildings.get(event.buildingId)?.name,
    assets.get(event.assetId)?.name,
  ].filter(Boolean);

  const Icon = EVENT_ICONS[event.kind];

  return (
    <li>
      <Link
        href={event.href}
        data-testid="calendar-event"
        className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
      >
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {[
              showDate ? formatDate(event.date, settings.language) : null,
              event.time || null,
              t(event.labelKey),
              ...context,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {event.recurring ? (
          <span
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"
            data-testid="calendar-recurring"
          >
            <Repeat className="size-3.5" aria-hidden />
            {t('calendar.recurring')}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
