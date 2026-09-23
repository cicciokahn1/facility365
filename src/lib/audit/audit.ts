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
import type { TranslationKey } from '@/lib/i18n/dictionary';
import type {
  Asset,
  Inspection,
  TechnicalCheckpointDefinition,
  TechnicalCheckpointResult,
} from '@/lib/types';
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

export interface TechnicalCheckpoint {
  key: string;
  label: string;
  kind: 'status' | 'measurement' | 'note';
  unit?: string;
  target?: string;
}

const TECHNICAL_CHECKPOINTS: Record<string, TechnicalCheckpoint[]> = {
  wasser: [
    { key: 'salt', label: 'Salzvorrat', kind: 'measurement', unit: 'kg' },
    { key: 'hardness', label: 'Wasserhärte', kind: 'measurement', unit: '°fH' },
    { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
    { key: 'leakage', label: 'Leckage', kind: 'status' },
    { key: 'alarm', label: 'Anzeige / Fehlermeldung', kind: 'note' },
    { key: 'regeneration', label: 'Regeneration', kind: 'status' },
    { key: 'quality', label: 'Wasserqualität', kind: 'note' },
  ],
  heizung: [
    { key: 'flow', label: 'Vorlauf', kind: 'measurement', unit: '°C' },
    { key: 'return', label: 'Rücklauf', kind: 'measurement', unit: '°C' },
    { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
    { key: 'temperature', label: 'Temperatur', kind: 'measurement', unit: '°C' },
    { key: 'pump', label: 'Pumpe', kind: 'status' },
    { key: 'burner', label: 'Brenner / Wärmeerzeuger', kind: 'status' },
    { key: 'alarm', label: 'Fehlermeldungen', kind: 'note' },
    { key: 'leakage', label: 'Leckage', kind: 'status' },
  ],
  allgemein: [
    { key: 'operating', label: 'Betriebszustand', kind: 'status' },
    { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
    { key: 'temperature', label: 'Temperatur', kind: 'measurement', unit: '°C' },
    { key: 'alarm', label: 'Anzeige / Fehlermeldung', kind: 'note' },
    { key: 'leakage', label: 'Leckage', kind: 'status' },
    { key: 'note', label: 'Bemerkung', kind: 'note' },
  ],
};

const TECHNICAL_ALIASES: Record<string, string[]> = {
  waermepumpe: ['wärmepumpe', 'heat pump'],
  lueftung: ['lüft', 'ventilation'],
  kaelte: ['kälte', 'kuehl', 'cooling'],
  elektro: ['elektro', 'strom', 'electric'],
  pv: ['pv', 'photovolta'],
  pumpen: ['pumpe'],
  druckluft: ['druckluft', 'kompressor', 'compressor'],
  lift: ['lift', 'aufzug', 'elevator'],
  brand: ['brandmelde', 'brand alarm'],
  sprinkler: ['sprinkler'],
};

const technicalCategoryOf = (asset: Asset): string => {
  const text = `${asset.category} ${asset.name}`.toLocaleLowerCase('de-CH');
  if (/(enthärt|wasser|sanitär|warmwasser|druckerhöhung)/.test(text)) return 'wasser';
  if (/(heiz|brenner|kessel)/.test(text) && !text.includes('wärmepumpe')) return 'heizung';
  const alias = Object.entries(TECHNICAL_ALIASES).find(([, values]) =>
    values.some((value) => text.includes(value)),
  );
  if (alias) return alias[0];
  return 'allgemein';
};

const defaultCheckpointsOf = (category: string): TechnicalCheckpoint[] => {
  const specific: Record<string, TechnicalCheckpoint[]> = {
    waermepumpe: [
      { key: 'flow', label: 'Vorlauf', kind: 'measurement', unit: '°C' },
      { key: 'return', label: 'Rücklauf', kind: 'measurement', unit: '°C' },
      { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
      { key: 'compressor', label: 'Verdichter', kind: 'status' },
      { key: 'alarm', label: 'Fehlermeldung', kind: 'note' },
    ],
    lueftung: [
      { key: 'supply', label: 'Zuluft', kind: 'measurement', unit: '°C' },
      { key: 'extract', label: 'Abluft', kind: 'measurement', unit: '°C' },
      { key: 'filter', label: 'Filter', kind: 'status' },
      { key: 'fan', label: 'Ventilator', kind: 'status' },
      { key: 'alarm', label: 'Fehlermeldung', kind: 'note' },
    ],
    kaelte: [
      { key: 'temperature', label: 'Temperatur', kind: 'measurement', unit: '°C' },
      { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
      { key: 'compressor', label: 'Kompressor', kind: 'status' },
      { key: 'leakage', label: 'Leckage', kind: 'status' },
    ],
    elektro: [
      { key: 'voltage', label: 'Spannung', kind: 'measurement', unit: 'V' },
      { key: 'current', label: 'Strom', kind: 'measurement', unit: 'A' },
      { key: 'protection', label: 'Schutz / Sicherungen', kind: 'status' },
      { key: 'alarm', label: 'Fehlermeldung', kind: 'note' },
    ],
    pv: [
      { key: 'power', label: 'Leistung', kind: 'measurement', unit: 'kW' },
      { key: 'yield', label: 'Ertrag', kind: 'measurement', unit: 'kWh' },
      { key: 'inverter', label: 'Wechselrichter', kind: 'status' },
      { key: 'alarm', label: 'Fehlermeldung', kind: 'note' },
    ],
    pumpen: [
      { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
      { key: 'flow', label: 'Fördermenge', kind: 'measurement', unit: 'l/min' },
      { key: 'pump', label: 'Pumpe', kind: 'status' },
      { key: 'leakage', label: 'Leckage', kind: 'status' },
    ],
    druckluft: [
      { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
      { key: 'temperature', label: 'Temperatur', kind: 'measurement', unit: '°C' },
      { key: 'compressor', label: 'Kompressor', kind: 'status' },
      { key: 'leakage', label: 'Leckage', kind: 'status' },
    ],
    lift: [
      { key: 'operation', label: 'Betriebszustand', kind: 'status' },
      { key: 'doors', label: 'Türen', kind: 'status' },
      { key: 'alarm', label: 'Notruf / Fehlermeldung', kind: 'note' },
    ],
    brand: [
      { key: 'operation', label: 'Betriebszustand', kind: 'status' },
      { key: 'alarm', label: 'Alarm / Fehlermeldung', kind: 'note' },
      { key: 'power', label: 'Spannungsversorgung', kind: 'status' },
    ],
    sprinkler: [
      { key: 'pressure', label: 'Druck', kind: 'measurement', unit: 'bar' },
      { key: 'valve', label: 'Ventile', kind: 'status' },
      { key: 'alarm', label: 'Alarm / Fehlermeldung', kind: 'note' },
    ],
  };
  return specific[category] ?? TECHNICAL_CHECKPOINTS[category] ?? TECHNICAL_CHECKPOINTS.allgemein;
};

export const technicalCategoryKeyOf = (asset: Asset): string => technicalCategoryOf(asset);

export const technicalCheckpointsOf = (
  asset: Asset,
  templates: Record<string, TechnicalCheckpointDefinition[]> = {},
): TechnicalCheckpoint[] => asset.technicalChecklist ?? templates[technicalCategoryOf(asset)] ?? defaultCheckpointsOf(technicalCategoryOf(asset));

const TECHNICAL_CATEGORY_LABELS: Record<string, string> = {
  wasser: 'Wasseranlage',
  heizung: 'Heizung',
  waermepumpe: 'Wärmepumpe',
  lueftung: 'Lüftung',
  kaelte: 'Kälteanlage',
  elektro: 'Elektro',
  pv: 'PV-Anlage',
  pumpen: 'Pumpen',
  druckluft: 'Druckluft',
  lift: 'Lift',
  brand: 'Brandmeldeanlage',
  sprinkler: 'Sprinkleranlage',
};

export const technicalCategoryLabelOf = (asset: Asset): string =>
  TECHNICAL_CATEGORY_LABELS[technicalCategoryOf(asset)] ?? asset.category ?? 'Technische Anlage';

export const technicalAttentionOf = (
  checkpoints: TechnicalCheckpointResult[],
): boolean =>
  checkpoints.some(
    (checkpoint) => checkpoint.status === 'attention' || /fehler|leckage|störung/i.test(checkpoint.value),
  );

export const previousTechnicalMeasurementsOf = (
  inspections: Inspection[],
  assetId: string,
): Record<string, string> => {
  const previous = inspections
    .filter((inspection) => inspection.assetId === assetId && inspection.technicalMeasurements)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
  return previous?.technicalMeasurements ?? {};
};

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
  const inspections = useCollectionItems('inspections');
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

    const inspectionRows: AuditRow[] = inspections
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
          href: `/inspections/${check.id}`,
          number: check.number,
          title: check.title || check.customType || check.number,
          date: check.date,
          tone,
          statusKey: overdue
            ? ('audit.overdue' as TranslationKey)
            : (`rcd.${check.result}` as TranslationKey),
          detail: check.tester,
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
      { key: 'inspections', labelKey: 'module.inspections' as TranslationKey, rows: inspectionRows },
      { key: 'maintenances', labelKey: 'module.maintenances' as TranslationKey, rows: maintenanceRows },
      { key: 'orders', labelKey: 'module.orders' as TranslationKey, rows: orderRows },
      { key: 'damages', labelKey: 'audit.openDamages' as TranslationKey, rows: damageRows },
      { key: 'contracts', labelKey: 'audit.openContracts' as TranslationKey, rows: contractRows },
    ];
  }, [contracts, damages, filter, inspections, legionella, maintenances, orders, rcd]);
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
