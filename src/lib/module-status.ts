/**
 * Abgeschlossene Zustaende je Modul.
 *
 * Listen zeigen standardmaessig nur offene Datensaetze; abgeschlossene bleiben
 * vollstaendig erhalten und sind ueber den Filter jederzeit sichtbar.
 */
import { CollectionKey } from "@/lib/types";

const CLOSED_STATUS: Partial<Record<CollectionKey, readonly string[]>> = {
  orders: ["done", "invoiced"],
  damages: ["fixed", "rejected"],
  tickets: ["done", "closed"],
  maintenances: ["done"],
  rcd: ["done"],
  inspections: ["done"],
  playgroundchecks: ["done"],
  firechecks: ["done"],
  legionella: ["ok"],
  cleaningtasks: ["done"],
  cleaningchecks: ["ok"],
  cleaningcomplaints: ["resolved", "rejected"],
  appointments: ["done", "cancelled"],
  reports: ["final"],
  quotes: ["accepted", "rejected", "expired"],
  invoices: ["paid", "cancelled"],
};

/** Zustaende, die als erledigt gelten; leer, wenn das Modul keine kennt. */
export function closedStatusValues(
  collection: CollectionKey,
): readonly string[] {
  return CLOSED_STATUS[collection] ?? [];
}

export function isClosedStatus(
  collection: CollectionKey,
  value: string,
): boolean {
  return closedStatusValues(collection).includes(value);
}
