'use client';

/**
 * Termine des Kalenders.
 *
 * Der Kalender fuehrt keine eigenen Daten: er liest Auftraege und Wartungen
 * und leitet daraus Termine ab. Wiederkehrende Wartungen erzeugen aus dem
 * naechsten Termin und dem Intervall die Folgetermine.
 */
import { useMemo } from 'react';

import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { MaintenanceInterval } from '@/lib/types';
import { isDone } from '@/lib/workflow/complete';

export type CalendarEventKind = 'order' | 'maintenance';

export interface CalendarEvent {
  id: string;
  kind: CalendarEventKind;
  /** Datensatz, aus dem der Termin stammt. */
  sourceId: string;
  href: string;
  labelKey: TranslationKey;
  title: string;
  /** Tag als ISO-Datum. */
  date: string;
  /** Uhrzeit als HH:MM; leer, wenn nur der Tag feststeht. */
  time: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  assetId: string;
  /** Wahr bei einem errechneten Folgetermin einer wiederkehrenden Wartung. */
  recurring: boolean;
}

/** Monate je Intervall. */
const INTERVAL_MONTHS: Record<MaintenanceInterval, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  biennial: 24,
};

/** Wie weit die Folgetermine im Voraus berechnet werden. */
const HORIZON_MONTHS = 24;

const addMonths = (date: string, months: number): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  const day = parsed.getDate();
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + months);
  /** Kuerzere Monate: der Termin rutscht auf den letzten Tag des Monats. */
  const lastDay = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).getDate();
  parsed.setDate(Math.min(day, lastDay));
  return parsed.toISOString().slice(0, 10);
};

const horizon = (): string => addMonths(new Date().toISOString().slice(0, 10), HORIZON_MONTHS);

/** Termine, sortiert nach Tag und Uhrzeit. */
export function useCalendarEvents(): CalendarEvent[] {
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');

  return useMemo(() => {
    const events: CalendarEvent[] = [];
    const until = horizon();

    orders
      .filter((order) => !isDone('orders', order.status))
      .forEach((order) => {
        const date = order.dueDate || order.workDate;
        if (!date) return;
        events.push({
          id: `order-${order.id}`,
          kind: 'order',
          sourceId: order.id,
          href: `/orders/${order.id}`,
          labelKey: 'module.orders.singular',
          title: order.title || order.number,
          date,
          time: order.workStart,
          customerId: order.customerId,
          propertyId: order.propertyId,
          buildingId: order.buildingId,
          assetId: order.assetId,
          recurring: false,
        });
      });

    maintenances
      .filter((maintenance) => !isDone('maintenances', maintenance.status) && maintenance.nextDate)
      .forEach((maintenance) => {
        const step = INTERVAL_MONTHS[maintenance.interval] ?? 12;
        let date = maintenance.nextDate;
        let index = 0;
        while (date && date <= until) {
          events.push({
            id: `maintenance-${maintenance.id}-${index}`,
            kind: 'maintenance',
            sourceId: maintenance.id,
            href: `/maintenances/${maintenance.id}`,
            labelKey: 'module.maintenances.singular',
            title: maintenance.title || maintenance.number,
            date,
            time: '',
            customerId: '',
            propertyId: maintenance.propertyId,
            buildingId: maintenance.buildingId,
            assetId: maintenance.assetId,
            recurring: index > 0,
          });
          index += 1;
          date = addMonths(date, step);
        }
      });

    return events.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [maintenances, orders]);
}

/** Termine eines Tages. */
export const eventsOn = (events: CalendarEvent[], date: string): CalendarEvent[] =>
  events.filter((event) => event.date === date);
