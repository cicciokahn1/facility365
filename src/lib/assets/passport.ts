/**
 * Digitaler Anlagenpass.
 *
 * Die Anlagen-ID (ANL-000123) ist die dauerhafte Kennung der Anlage. Sie steht
 * auf dem Etikett am Geraet, wird nie geaendert und ist der einzige Inhalt des
 * QR-Codes. Aendert sich spaeter Name, Gebaeude oder Hersteller, bleibt das
 * gedruckte Etikett gueltig.
 */
import { Asset, Damage, Maintenance, Order, Report } from '@/lib/types';

/** Adresse hinter dem QR-Code; sie enthaelt ausschliesslich die Anlagen-ID. */
export const assetCodeUrl = (assetNumber: string): string =>
  typeof window === 'undefined'
    ? `/assets/${assetNumber}`
    : `${window.location.origin}/assets/${assetNumber}`;

/**
 * Anlage zu einem beliebigen Bezeichner.
 *
 * Erlaubt sind die Anlagen-ID, die technische Kennung, die Seriennummer und
 * eine vollstaendige Adresse, damit auch aeltere Etiketten weiter funktionieren.
 */
export const findAsset = (assets: Asset[], value: string): Asset | undefined => {
  const needle = value.trim().toLowerCase();
  if (!needle) return undefined;
  const tail = needle.split('/').filter(Boolean).pop() ?? needle;
  return (
    assets.find((asset) => asset.number.toLowerCase() === tail) ??
    assets.find((asset) => asset.id.toLowerCase() === tail) ??
    assets.find((asset) => asset.serialNumber && asset.serialNumber.toLowerCase() === tail) ??
    assets.find((asset) => needle.includes(asset.number.toLowerCase())) ??
    assets.find((asset) => needle.includes(asset.id.toLowerCase()))
  );
};

const byDateDesc = (a: string, b: string): number => b.localeCompare(a);

/** Zuletzt ausgefuehrte Wartung. */
export const lastMaintenanceDate = (maintenances: Maintenance[]): string =>
  maintenances
    .map((maintenance) => maintenance.lastDate)
    .filter(Boolean)
    .sort(byDateDesc)[0] ?? '';

/**
 * Naechster Wartungstermin.
 *
 * Bevorzugt der naechste in der Zukunft; liegen alle Termine zurueck, wird der
 * juengste gezeigt, damit ein ueberfaelliger Termin nicht verschwindet.
 */
export const nextMaintenanceDate = (maintenances: Maintenance[]): string => {
  const today = new Date().toISOString().slice(0, 10);
  const dates = maintenances.map((maintenance) => maintenance.nextDate).filter(Boolean);
  const upcoming = dates.filter((date) => date >= today).sort((a, b) => a.localeCompare(b));
  return upcoming[0] ?? dates.sort(byDateDesc)[0] ?? '';
};

export type ServiceKind = 'maintenance' | 'order' | 'damage' | 'report';

export interface ServiceEvent {
  id: string;
  kind: ServiceKind;
  /** ISO-Datum des Ereignisses. */
  date: string;
  number: string;
  title: string;
  /** Ausfuehrende Firma oder verantwortliche Person. */
  party: string;
  status: string;
  path: string;
  documentCount: number;
}

/** Alle Arbeiten an einer Anlage, chronologisch mit dem Neuesten zuoberst. */
export const serviceHistory = (
  maintenances: Maintenance[],
  orders: Order[],
  damages: Damage[],
  reports: Report[],
): ServiceEvent[] => {
  const events: ServiceEvent[] = [
    ...maintenances.map((maintenance) => ({
      id: maintenance.id,
      kind: 'maintenance' as const,
      date: maintenance.lastDate || maintenance.nextDate || maintenance.createdAt.slice(0, 10),
      number: maintenance.number,
      title: maintenance.title,
      party: maintenance.company || maintenance.responsible,
      status: maintenance.status,
      path: `/maintenances/${maintenance.id}`,
      documentCount: maintenance.documents.length,
    })),
    ...orders.map((order) => ({
      id: order.id,
      kind: 'order' as const,
      date: order.dueDate || order.createdAt.slice(0, 10),
      number: order.number,
      title: order.title,
      party: order.assignee,
      status: order.status,
      path: `/orders/${order.id}`,
      documentCount: order.documents.length,
    })),
    ...damages.map((damage) => ({
      id: damage.id,
      kind: 'damage' as const,
      date: damage.reportedAt || damage.createdAt.slice(0, 10),
      number: damage.number,
      title: damage.title,
      party: damage.reportedBy,
      status: damage.status,
      path: `/damages/${damage.id}`,
      documentCount: damage.documents.length,
    })),
    ...reports.map((report) => ({
      id: report.id,
      kind: 'report' as const,
      date: report.date || report.createdAt.slice(0, 10),
      number: report.number,
      title: report.title,
      party: report.author,
      status: report.status,
      path: `/reports/${report.id}`,
      documentCount: report.documents.length,
    })),
  ];

  return events.sort((a, b) => byDateDesc(a.date, b.date));
};
