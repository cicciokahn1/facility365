'use client';

/**
 * Auditmodus.
 *
 * Fuehrt fuer einen Standort und einen Zeitraum zusammen, was bei einer
 * Begehung geprueft wird: Kontrollen, Wartungen, Auftraege und offene Punkte.
 * Jede Zeile traegt eine Ampel; eigene Daten entstehen nicht.
 */
import { useMemo } from 'react';

import { isReminderDue, reminderDate } from '@/lib/contracts/reminder';
import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { today } from '@/lib/utils/format';
import { isDone } from '@/lib/workflow/complete';

/** Ampel einer Zeile: erledigt, offen oder ueberfaellig/nicht bestanden. */
export type AuditTone = 'green' | 'amber' | 'red';

export interface AuditRow {
  id: string;
  href: string;
  number: string;
  title: string;
  /** Datum der Zeile: Pruefdatum, Termin oder Meldedatum. */
  date: string;
  tone: AuditTone;
  statusKey: TranslationKey;
  detail: string;
}

export interface AuditSection {
  key: string;
  labelKey: TranslationKey;
  rows: AuditRow[];
}

export interface AuditFilter {
  propertyId: string;
  buildingId: string;
  from: string;
  to: string;
}

/** Wahr, wenn der Datensatz zum gewaehlten Standort gehoert. */
const atLocation = (
  filter: AuditFilter,
  propertyId: string,
  buildingId: string,
): boolean => {
  if (filter.propertyId && filter.propertyId !== propertyId) return false;
  if (filter.buildingId && filter.buildingId !== buildingId) return false;
  return true;
};

/** Wahr, wenn das Datum im Zeitraum liegt; ohne Datum bleibt die Zeile draussen. */
const inRange = (filter: AuditFilter, date: string): boolean =>
  Boolean(date) && date >= filter.from && date <= filter.to;

export function useAuditSections(filter: AuditFilter): AuditSection[] {
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const maintenances = useCollectionItems('maintenances');
  const orders = useCollectionItems('orders');
  const damages = useCollectionItems('damages');
  const contracts = useCollectionItems('contracts');

  return useMemo(() => {
    const now = today();

    const legionellaRows: AuditRow[] = legionella
      .filter(
        (check) =>
          atLocation(filter, check.propertyId, check.buildingId) &&
          (inRange(filter, check.date) || inRange(filter, check.nextDate)),
      )
      .map((check) => {
        const overdue = Boolean(check.nextDate) && check.nextDate < now;
        const tone: AuditTone =
          check.result === 'critical' || overdue
            ? 'red'
            : check.result === 'ok'
              ? 'green'
              : 'amber';
        return {
          id: check.id,
          href: `/legionella/${check.id}`,
          number: check.number,
          title: check.title || check.system || check.number,
          date: check.date,
          tone,
          statusKey: overdue
            ? ('audit.overdue' as TranslationKey)
            : (`legionella.${check.result}` as TranslationKey),
          detail: check.measuringPoint,
        };
      });

    const rcdRows: AuditRow[] = rcd
      .filter(
        (check) =>
          atLocation(filter, check.propertyId, check.buildingId) &&
          (inRange(filter, check.date) || inRange(filter, check.nextDate)),
      )
      .map((check) => {
        const overdue = check.status !== 'done' && Boolean(check.nextDate) && check.nextDate < now;
        const tone: AuditTone =
          check.result === 'failed' || overdue
            ? 'red'
            : check.result === 'passed'
              ? 'green'
              : 'amber';
        return {
          id: check.id,
          href: `/rcd/${check.id}`,
          number: check.number,
          title: check.title || check.device || check.number,
          date: check.date,
          tone,
          statusKey: overdue
            ? ('audit.overdue' as TranslationKey)
            : (`rcd.${check.result}` as TranslationKey),
          detail: check.distribution,
        };
      });

    const maintenanceRows: AuditRow[] = maintenances
      .filter(
        (maintenance) =>
          atLocation(filter, maintenance.propertyId, maintenance.buildingId) &&
          (inRange(filter, maintenance.lastDate) || inRange(filter, maintenance.nextDate)),
      )
      .map((maintenance) => {
        const done = isDone('maintenances', maintenance.status);
        const overdue = !done && Boolean(maintenance.nextDate) && maintenance.nextDate < now;
        return {
          id: maintenance.id,
          href: `/maintenances/${maintenance.id}`,
          number: maintenance.number,
          title: maintenance.title || maintenance.number,
          date: maintenance.nextDate || maintenance.lastDate,
          tone: overdue ? 'red' : done ? 'green' : 'amber',
          statusKey: overdue
            ? ('audit.overdue' as TranslationKey)
            : (`status.${maintenance.status}` as TranslationKey),
          detail: maintenance.responsible || maintenance.company,
        };
      });

    const orderRows: AuditRow[] = orders
      .filter(
        (order) =>
          atLocation(filter, order.propertyId, order.buildingId) &&
          (inRange(filter, order.dueDate) ||
            inRange(filter, order.workDate) ||
            inRange(filter, order.completedAt)),
      )
      .map((order) => {
        const done = isDone('orders', order.status);
        const overdue = !done && Boolean(order.dueDate) && order.dueDate < now;
        return {
          id: order.id,
          href: `/orders/${order.id}`,
          number: order.number,
          title: order.title || order.number,
          date: order.dueDate || order.workDate,
          tone: overdue ? 'red' : done ? 'green' : 'amber',
          statusKey: overdue
            ? ('audit.overdue' as TranslationKey)
            : (`status.${order.status}` as TranslationKey),
          detail: order.assignee,
        };
      });

    const damageRows: AuditRow[] = damages
      .filter(
        (damage) =>
          !isDone('damages', damage.status) &&
          atLocation(filter, damage.propertyId, damage.buildingId) &&
          inRange(filter, damage.reportedAt),
      )
      .map((damage) => ({
        id: damage.id,
        href: `/damages/${damage.id}`,
        number: damage.number,
        title: damage.title || damage.number,
        date: damage.reportedAt,
        tone: damage.priority === 'critical' || damage.priority === 'high' ? 'red' : 'amber',
        statusKey: `status.${damage.status}` as TranslationKey,
        detail: damage.reportedBy,
      }));

    const contractRows: AuditRow[] = contracts
      .filter(
        (contract) =>
          isReminderDue(contract, now) &&
          atLocation(filter, contract.propertyId, contract.buildingId),
      )
      .map((contract) => ({
        id: contract.id,
        href: `/contracts/${contract.id}`,
        number: contract.number,
        title: contract.title || contract.partner || contract.number,
        date: contract.end,
        tone: 'amber' as AuditTone,
        statusKey: 'contracts.reminderTitle' as TranslationKey,
        detail: reminderDate(contract),
      }));

    return [
      { key: 'legionella', labelKey: 'module.legionella' as TranslationKey, rows: legionellaRows },
      { key: 'rcd', labelKey: 'module.rcd' as TranslationKey, rows: rcdRows },
      { key: 'maintenances', labelKey: 'module.maintenances' as TranslationKey, rows: maintenanceRows },
      { key: 'orders', labelKey: 'module.orders' as TranslationKey, rows: orderRows },
      { key: 'damages', labelKey: 'audit.openDamages' as TranslationKey, rows: damageRows },
      { key: 'contracts', labelKey: 'audit.openContracts' as TranslationKey, rows: contractRows },
    ];
  }, [contracts, damages, filter, legionella, maintenances, orders, rcd]);
}

/** Zaehlt die Ampeln ueber alle Bereiche. */
export const countTones = (sections: AuditSection[]): Record<AuditTone, number> =>
  sections.reduce(
    (total, section) => {
      section.rows.forEach((row) => {
        total[row.tone] += 1;
      });
      return total;
    },
    { green: 0, amber: 0, red: 0 } as Record<AuditTone, number>,
  );
