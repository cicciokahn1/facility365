'use client';

/**
 * Erledigt-Logik fuer Auftrag, Wartung und Schaden.
 *
 * Ueberall derselbe Ablauf: Status auf erledigt, Tag des Abschlusses setzen,
 * Eintrag in der Historie. Damit verschwindet der Datensatz aus den offenen
 * und faelligen Listen samt Dashboard, bleibt aber vollstaendig erhalten.
 */
import { useCallback } from 'react';

import { useCollection } from '@/lib/data/store';
import { useCurrentUser } from '@/lib/settings/provider';
import { Damage, Maintenance, Order } from '@/lib/types';
import { today } from '@/lib/utils/format';

export type CompletableKey = 'orders' | 'maintenances' | 'damages';

/** Werte, die ein Abschluss je Modul setzt. */
const doneValues = {
  orders: (): Partial<Order> => ({ status: 'done', completedAt: today() }),
  maintenances: (): Partial<Maintenance> => ({ status: 'done', lastDate: today() }),
  damages: (): Partial<Damage> => ({ status: 'fixed', fixedAt: today() }),
};

/** Erledigte Zustaende; sie zaehlen nirgends mehr als offen oder faellig. */
const doneStatuses: Record<CompletableKey, string[]> = {
  orders: ['done', 'invoiced'],
  maintenances: ['done'],
  damages: ['fixed', 'rejected'],
};

/** Wahr, sobald der Datensatz abgeschlossen ist. */
export const isDone = (collection: CompletableKey, status: string): boolean =>
  doneStatuses[collection].includes(status);

/** Setzt den Datensatz auf erledigt; der Aufrufer liefert nur die Kennung. */
export function useMarkDone(collection: CompletableKey): (id: string) => void {
  const { update } = useCollection(collection);
  const user = useCurrentUser();

  return useCallback(
    (id: string) => update(id, doneValues[collection](), 'history.completed', user),
    [collection, update, user],
  );
}
