"use client";

/**
 * Erledigt-Logik fuer Auftrag, Wartung, Schaden, Reinigungsaufgabe und die
 * Kontrollmodule.
 *
 * Ueberall derselbe Ablauf: Status auf erledigt, Tag des Abschlusses setzen,
 * Eintrag in der Historie. Damit verschwindet der Datensatz aus den offenen
 * und faelligen Listen samt Dashboard, bleibt aber vollstaendig erhalten.
 */
import { useCallback } from "react";

import { useCollection } from "@/lib/data/store";
import { useCurrentUser } from "@/lib/settings/provider";
import {
  CleaningTask,
  Damage,
  FireCheck,
  Inspection,
  Maintenance,
  Order,
  PlaygroundCheck,
  RcdCheck,
  Ticket,
} from "@/lib/types";
import { today } from "@/lib/utils/format";

export type CompletableKey =
  | "orders"
  | "maintenances"
  | "damages"
  | "cleaningtasks"
  | "inspections"
  | "firechecks"
  | "playgroundchecks"
  | "rcd"
  | "tickets";

/** Werte, die ein Abschluss je Modul setzt. */
const doneValues = {
  orders: (): Partial<Order> => ({ status: "done", completedAt: today() }),
  maintenances: (maintenance: Maintenance): Partial<Maintenance> => ({
    status: "planned",
    lastDate: today(),
    nextDate: nextMaintenanceDate(today(), maintenance.interval),
  }),
  damages: (): Partial<Damage> => ({ status: "fixed", fixedAt: today() }),
  cleaningtasks: (): Partial<CleaningTask> => ({
    status: "done",
    completedAt: today(),
  }),
  inspections: (): Partial<Inspection> => ({ status: "done" }),
  firechecks: (): Partial<FireCheck> => ({ status: "done" }),
  playgroundchecks: (): Partial<PlaygroundCheck> => ({ status: "done" }),
  rcd: (): Partial<RcdCheck> => ({ status: "done" }),
  tickets: (): Partial<Ticket> => ({ status: "done", closedAt: today() }),
};

function nextMaintenanceDate(
  date: string,
  interval: Maintenance["interval"],
): string {
  const next = new Date(`${date}T00:00:00`);
  const months =
    interval === "monthly"
      ? 1
      : interval === "quarterly"
        ? 3
        : interval === "semiannual"
          ? 6
          : interval === "biennial"
            ? 24
            : 12;
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

/** Erledigte Zustaende; sie zaehlen nirgends mehr als offen oder faellig. */
const doneStatuses: Record<CompletableKey, string[]> = {
  orders: ["done", "invoiced"],
  maintenances: ["done"],
  damages: ["fixed", "rejected"],
  cleaningtasks: ["done"],
  inspections: ["done"],
  firechecks: ["done"],
  playgroundchecks: ["done"],
  rcd: ["done"],
  tickets: ["done", "closed"],
};

/** Wahr, wenn ein Modul den Abschluss mit einem Klick kennt. */
export const isCompletable = (
  collection: string,
): collection is CompletableKey => collection in doneStatuses;

/** Wahr, sobald der Datensatz abgeschlossen ist. */
export const isDone = (collection: CompletableKey, status: string): boolean =>
  doneStatuses[collection].includes(status);

/** Setzt den Datensatz auf erledigt; der Aufrufer liefert nur die Kennung. */
export function useMarkDone(collection: CompletableKey): (id: string) => void {
  const { items, update } = useCollection(collection);
  const user = useCurrentUser();

  return useCallback(
    (id: string) => {
      if (collection === "maintenances") {
        const maintenance = items.find((item) => item.id === id);
        if (!maintenance) return;
        update(
          id,
          doneValues.maintenances(maintenance as Maintenance),
          "history.completed",
          user,
        );
        return;
      }
      update(id, doneValues[collection](), "history.completed", user);
    },
    [collection, items, update, user],
  );
}
