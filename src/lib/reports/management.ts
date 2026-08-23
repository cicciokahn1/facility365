'use client';

/**
 * Managementbericht.
 *
 * Fasst fuer einen Zeitraum zusammen, was in den bestehenden Modulen erfasst
 * ist: Auftraege, Schaeden, Wartungen, Reinigung, Kontrollen und Energiekosten,
 * je gesamt sowie im Vergleich nach Liegenschaft und Gebaeude. Eigene Daten
 * entstehen nicht; es wird nur gelesen.
 */
import { useMemo } from 'react';

import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { today } from '@/lib/utils/format';
import { isDone } from '@/lib/workflow/complete';

export interface ReportRange {
  from: string;
  to: string;
}

export interface ManagementMetric {
  key: string;
  labelKey: TranslationKey;
  value: number;
  /** Betrag statt Anzahl, z. B. Energiekosten. */
  currency?: boolean;
  /** Hinweis auf Handlungsbedarf; faerbt die Kachel. */
  alert?: boolean;
}

export interface ComparisonRow {
  id: string;
  label: string;
  orders: number;
  damages: number;
  maintenances: number;
  cleaning: number;
  inspections: number;
  energyCost: number;
}

export interface ManagementReport {
  metrics: ManagementMetric[];
  properties: ComparisonRow[];
  buildings: ComparisonRow[];
  /** Energiekosten des Vorjahreszeitraums; 0, wenn nichts erfasst ist. */
  energyCostPrevious: number;
  /** Wahr, solange im Zeitraum nichts erfasst ist. */
  empty: boolean;
}

const NONE = 'none';

/** Wahr, wenn das Datum im Zeitraum liegt; ohne Datum bleibt der Satz draussen. */
const inRange = (range: ReportRange, date: string): boolean =>
  Boolean(date) && date >= range.from && date <= range.to;

/** Monat YYYY-MM liegt im Zeitraum. */
const monthInRange = (range: ReportRange, month: string): boolean =>
  Boolean(month) && month >= range.from.slice(0, 7) && month <= range.to.slice(0, 7);

/** Derselbe Zeitraum ein Jahr frueher. */
const previousYear = (range: ReportRange): ReportRange => ({
  from: shiftYear(range.from),
  to: shiftYear(range.to),
});

const shiftYear = (date: string): string =>
  date ? `${String(Number(date.slice(0, 4)) - 1)}${date.slice(4)}` : date;

/** Zaehlt Werte je Schluessel in eine Vergleichszeile. */
const bump = (
  rows: Map<string, ComparisonRow>,
  id: string,
  label: string,
  field: keyof Omit<ComparisonRow, 'id' | 'label'>,
  amount: number,
): void => {
  const row = rows.get(id) ?? {
    id,
    label,
    orders: 0,
    damages: 0,
    maintenances: 0,
    cleaning: 0,
    inspections: 0,
    energyCost: 0,
  };
  row[field] += amount;
  rows.set(id, row);
};

export function useManagementReport(range: ReportRange): ManagementReport {
  const orders = useCollectionItems('orders');
  const damages = useCollectionItems('damages');
  const maintenances = useCollectionItems('maintenances');
  const cleaningTasks = useCollectionItems('cleaningtasks');
  const inspections = useCollectionItems('inspections');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const energy = useCollectionItems('energy');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  return useMemo(() => {
    const now = today();
    const previous = previousYear(range);
    const propertyRows = new Map<string, ComparisonRow>();
    const buildingRows = new Map<string, ComparisonRow>();

    const nameOfProperty = (id: string): string =>
      properties.find((item) => item.id === id)?.name || '';
    const nameOfBuilding = (id: string): string =>
      buildings.find((item) => item.id === id)?.name || '';

    const count = (
      propertyId: string,
      buildingId: string,
      field: keyof Omit<ComparisonRow, 'id' | 'label'>,
      amount = 1,
    ): void => {
      bump(
        propertyRows,
        propertyId || NONE,
        nameOfProperty(propertyId) || '',
        field,
        amount,
      );
      bump(buildingRows, buildingId || NONE, nameOfBuilding(buildingId) || '', field, amount);
    };

    const orderRows = orders.filter((order) =>
      [order.completedAt, order.workDate, order.dueDate].some((date) => inRange(range, date)),
    );
    orderRows.forEach((order) => count(order.propertyId, order.buildingId, 'orders'));
    const ordersDone = orderRows.filter((order) => isDone('orders', order.status)).length;
    const ordersOverdue = orders.filter(
      (order) => !isDone('orders', order.status) && Boolean(order.dueDate) && order.dueDate < now,
    ).length;
    const ordersOpen = orders.filter((order) => !isDone('orders', order.status)).length;

    const damageRows = damages.filter((damage) => inRange(range, damage.reportedAt));
    damageRows.forEach((damage) => count(damage.propertyId, damage.buildingId, 'damages'));
    const damagesOpen = damages.filter((damage) => !isDone('damages', damage.status)).length;

    const maintenanceRows = maintenances.filter((maintenance) =>
      [maintenance.lastDate, maintenance.nextDate].some((date) => inRange(range, date)),
    );
    maintenanceRows.forEach((maintenance) =>
      count(maintenance.propertyId, maintenance.buildingId, 'maintenances'),
    );
    const maintenancesDone = maintenanceRows.filter((maintenance) =>
      isDone('maintenances', maintenance.status),
    ).length;
    const maintenancesOverdue = maintenances.filter(
      (maintenance) =>
        !isDone('maintenances', maintenance.status) &&
        Boolean(maintenance.nextDate) &&
        maintenance.nextDate < now,
    ).length;

    const cleaningRows = cleaningTasks.filter((task) => inRange(range, task.date));
    cleaningRows.forEach((task) => count(task.propertyId, task.buildingId, 'cleaning'));
    const cleaningDone = cleaningRows.filter((task) => isDone('cleaningtasks', task.status)).length;

    const checks = [
      ...inspections.map((check) => ({
        propertyId: check.propertyId,
        buildingId: check.buildingId,
        date: check.date,
        nextDate: check.nextDate,
        done: check.status === 'done',
      })),
      ...legionella.map((check) => ({
        propertyId: check.propertyId,
        buildingId: check.buildingId,
        date: check.date,
        nextDate: check.nextDate,
        done: check.result === 'ok',
      })),
      ...rcd.map((check) => ({
        propertyId: check.propertyId,
        buildingId: check.buildingId,
        date: check.date,
        nextDate: check.nextDate,
        done: check.status === 'done',
      })),
    ];
    const checkRows = checks.filter((check) =>
      [check.date, check.nextDate].some((date) => inRange(range, date)),
    );
    checkRows.forEach((check) => count(check.propertyId, check.buildingId, 'inspections'));
    const checksDone = checkRows.filter((check) => check.done).length;
    const checksOverdue = checks.filter(
      (check) => !check.done && Boolean(check.nextDate) && check.nextDate < now,
    ).length;

    let energyCost = 0;
    energy.forEach((entry) => {
      if (!monthInRange(range, entry.month)) return;
      const cost = entry.cost ?? 0;
      energyCost += cost;
      count(entry.propertyId, entry.buildingId, 'energyCost', cost);
    });
    const energyCostPrevious = energy
      .filter((entry) => monthInRange(previous, entry.month))
      .reduce((sum, entry) => sum + (entry.cost ?? 0), 0);

    const metrics: ManagementMetric[] = [
      { key: 'orders', labelKey: 'report.ordersInRange' as TranslationKey, value: orderRows.length },
      { key: 'ordersDone', labelKey: 'report.ordersDone' as TranslationKey, value: ordersDone },
      { key: 'ordersOpen', labelKey: 'report.ordersOpen' as TranslationKey, value: ordersOpen },
      {
        key: 'ordersOverdue',
        labelKey: 'report.overdue' as TranslationKey,
        value: ordersOverdue,
        alert: ordersOverdue > 0,
      },
      { key: 'damages', labelKey: 'report.damagesInRange' as TranslationKey, value: damageRows.length },
      {
        key: 'damagesOpen',
        labelKey: 'report.damagesOpen' as TranslationKey,
        value: damagesOpen,
        alert: damagesOpen > 0,
      },
      {
        key: 'maintenances',
        labelKey: 'report.maintenancesInRange' as TranslationKey,
        value: maintenanceRows.length,
      },
      {
        key: 'maintenancesDone',
        labelKey: 'report.maintenancesDone' as TranslationKey,
        value: maintenancesDone,
      },
      {
        key: 'maintenancesOverdue',
        labelKey: 'report.maintenancesOverdue' as TranslationKey,
        value: maintenancesOverdue,
        alert: maintenancesOverdue > 0,
      },
      { key: 'cleaning', labelKey: 'report.cleaningInRange' as TranslationKey, value: cleaningRows.length },
      { key: 'cleaningDone', labelKey: 'report.cleaningDone' as TranslationKey, value: cleaningDone },
      { key: 'inspections', labelKey: 'report.checksInRange' as TranslationKey, value: checkRows.length },
      { key: 'inspectionsDone', labelKey: 'report.checksDone' as TranslationKey, value: checksDone },
      {
        key: 'inspectionsOverdue',
        labelKey: 'report.checksOverdue' as TranslationKey,
        value: checksOverdue,
        alert: checksOverdue > 0,
      },
      {
        key: 'energyCost',
        labelKey: 'report.energyCost' as TranslationKey,
        value: energyCost,
        currency: true,
      },
    ];

    const sort = (rows: Map<string, ComparisonRow>): ComparisonRow[] =>
      [...rows.values()]
        .filter(
          (row) =>
            row.orders + row.damages + row.maintenances + row.cleaning + row.inspections > 0 ||
            row.energyCost > 0,
        )
        .sort((a, b) => a.label.localeCompare(b.label));

    const propertyList = sort(propertyRows);
    const buildingList = sort(buildingRows);

    return {
      metrics,
      properties: propertyList,
      buildings: buildingList,
      energyCostPrevious,
      empty:
        orderRows.length +
          damageRows.length +
          maintenanceRows.length +
          cleaningRows.length +
          checkRows.length ===
          0 && energyCost === 0,
    };
  }, [
    buildings,
    cleaningTasks,
    damages,
    energy,
    inspections,
    legionella,
    maintenances,
    orders,
    properties,
    range,
    rcd,
  ]);
}

/** Zeitraum eines Monats als YYYY-MM-01 bis Monatsende. */
export const monthRange = (month: string): ReportRange => {
  const [year, part] = month.split('-');
  const last = new Date(Number(year), Number(part), 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
};

/** Zeitraum eines Kalenderjahres. */
export const yearRange = (year: string): ReportRange => ({
  from: `${year}-01-01`,
  to: `${year}-12-31`,
});
