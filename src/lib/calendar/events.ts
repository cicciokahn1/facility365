'use client';

/**
 * Termine des Kalenders.
 *
 * Der Kalender fuehrt keine eigenen Daten: er liest Auftraege und Wartungen
 * und leitet daraus Termine ab. Wiederkehrende Wartungen erzeugen aus dem
 * naechsten Termin und dem Intervall die Folgetermine.
 */
import { useMemo } from 'react';

import { cleaningDates } from '@/lib/cleaning/schedule';
import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { isContractOpen, reminderDate } from '@/lib/contracts/reminder';
import { MaintenanceInterval } from '@/lib/types';
import { isDone } from '@/lib/workflow/complete';

export type CalendarEventKind =
  | 'order'
  | 'maintenance'
  | 'legionella'
  | 'rcd'
  | 'contract'
  | 'cleaning';

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

/**
 * Vorausschau der Reinigungsplaene.
 *
 * Taegliche Plaene erzeugen sonst tausende Termine; drei Monate genuegen fuer
 * den Kalender und die Erinnerungen.
 */
const CLEANING_HORIZON_MONTHS = 3;
const CLEANING_MAX_EVENTS = 120;

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
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const contracts = useCollectionItems('contracts');
  const cleaningTasks = useCollectionItems('cleaningtasks');
  const cleaningPlans = useCollectionItems('cleaningplans');
  const cleaningAreas = useCollectionItems('cleaningareas');

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

    legionella
      .filter((check) => check.nextDate)
      .forEach((check) => {
        events.push({
          id: `legionella-${check.id}`,
          kind: 'legionella',
          sourceId: check.id,
          href: `/legionella/${check.id}`,
          labelKey: 'module.legionella.singular',
          title: check.title || check.system || check.number,
          date: check.nextDate,
          time: '',
          customerId: '',
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: '',
          recurring: false,
        });
      });

    rcd
      .filter((check) => check.status !== 'done' && check.nextDate)
      .forEach((check) => {
        events.push({
          id: `rcd-${check.id}`,
          kind: 'rcd',
          sourceId: check.id,
          href: `/rcd/${check.id}`,
          labelKey: 'module.rcd.singular',
          title: check.title || check.device || check.number,
          date: check.nextDate,
          time: '',
          customerId: '',
          propertyId: check.propertyId,
          buildingId: check.buildingId,
          assetId: check.assetId,
          recurring: false,
        });
      });

    /** Vertraege: Erinnerung vor Ablauf der Kuendigungsfrist und das Vertragsende. */
    contracts.filter(isContractOpen).forEach((contract) => {
      const title = contract.title || contract.partner || contract.number;
      const reminder = reminderDate(contract);
      const dates = reminder && reminder !== contract.end ? [reminder, contract.end] : [contract.end];
      dates.forEach((date, index) => {
        events.push({
          id: `contract-${contract.id}-${index}`,
          kind: 'contract',
          sourceId: contract.id,
          href: `/contracts/${contract.id}`,
          labelKey: 'module.contracts.singular',
          title,
          date,
          time: '',
          customerId: contract.customerId,
          propertyId: contract.propertyId,
          buildingId: contract.buildingId,
          assetId: '',
          recurring: false,
        });
      });
    });

    /** Offene Reinigungsaufgaben mit Termin. */
    cleaningTasks
      .filter((task) => !isDone('cleaningtasks', task.status) && task.date)
      .forEach((task) => {
        events.push({
          id: `cleaning-task-${task.id}`,
          kind: 'cleaning',
          sourceId: task.id,
          href: `/cleaning/tasks/${task.id}`,
          labelKey: 'module.cleaningtasks.singular',
          title: task.title || task.number,
          date: task.date,
          time: task.workStart,
          customerId: '',
          propertyId: task.propertyId,
          buildingId: task.buildingId,
          assetId: '',
          recurring: false,
        });
      });

    /** Wiederkehrende Reinigungen aus den Plaenen. */
    const cleaningUntil = addMonths(new Date().toISOString().slice(0, 10), CLEANING_HORIZON_MONTHS);
    cleaningPlans
      .filter((plan) => plan.status === 'active' && plan.nextDate)
      .forEach((plan) => {
        const area = cleaningAreas.find((entry) => entry.id === plan.areaId);
        cleaningDates(plan.nextDate, plan, cleaningUntil, CLEANING_MAX_EVENTS).forEach(
          (date, index) => {
            events.push({
              id: `cleaning-plan-${plan.id}-${index}`,
              kind: 'cleaning',
              sourceId: plan.id,
              href: `/cleaning/plans/${plan.id}`,
              labelKey: 'module.cleaningplans.singular',
              title: plan.title || plan.number,
              date,
              time: plan.timeStart,
              customerId: '',
              propertyId: area?.propertyId ?? '',
              buildingId: area?.buildingId ?? '',
              assetId: '',
              recurring: index > 0,
            });
          },
        );
      });

    return events.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [
    cleaningAreas,
    cleaningPlans,
    cleaningTasks,
    contracts,
    legionella,
    maintenances,
    orders,
    rcd,
  ]);
}

/** Termine eines Tages. */
export const eventsOn = (events: CalendarEvent[], date: string): CalendarEvent[] =>
  events.filter((event) => event.date === date);
