'use client';

/**
 * Aenderungen an Terminen direkt aus dem Kalender.
 *
 * Ein Termin gehoert immer zu einem Datensatz eines bestehenden Moduls. Wird er
 * verschoben, aendert sich nur das Datumsfeld dieses Datensatzes; wird er
 * geloescht, wandert der Datensatz wie ueberall in den Papierkorb. Errechnete
 * Folgetermine tragen keinen Datensatz und bleiben unveraendert.
 */
import { useCallback, useMemo } from 'react';

import { useAccess } from '@/lib/auth/scope';
import { CalendarEvent } from '@/lib/calendar/events';
import { useCollection } from '@/lib/data/store';
import { BaseEntity, CollectionKey } from '@/lib/types';

interface Mutator {
  update: (id: string, values: Record<string, unknown>) => void;
  remove: (id: string) => void;
}

export interface CalendarMutations {
  /** Laesst sich der Termin verschieben (Schreibrecht auf dem Modul)? */
  canEdit: (event: CalendarEvent) => boolean;
  /** Laesst sich der Datensatz hinter dem Termin loeschen? */
  canRemove: (event: CalendarEvent) => boolean;
  /** Termin auf einen anderen Tag legen. */
  move: (event: CalendarEvent, date: string) => void;
  /** Weitere Felder des Datensatzes setzen. */
  patch: (event: CalendarEvent, values: Record<string, unknown>) => void;
  /** Datensatz in den Papierkorb legen. */
  remove: (event: CalendarEvent) => void;
}

export function useCalendarMutations(): CalendarMutations {
  const access = useAccess();
  const appointments = useCollection('appointments');
  const orders = useCollection('orders');
  const maintenances = useCollection('maintenances');
  const legionella = useCollection('legionella');
  const rcd = useCollection('rcd');
  const inspections = useCollection('inspections');
  const playgroundchecks = useCollection('playgroundchecks');
  const firechecks = useCollection('firechecks');
  const documents = useCollection('documents');
  const cleaningtasks = useCollection('cleaningtasks');
  const solarplants = useCollection('solarplants');

  const mutators = useMemo(() => {
    const api = {
      appointments,
      orders,
      maintenances,
      legionella,
      rcd,
      inspections,
      playgroundchecks,
      firechecks,
      documents,
      cleaningtasks,
      solarplants,
    };
    const entries = Object.entries(api) as [
      CollectionKey,
      { update: (id: string, values: Partial<BaseEntity>) => void; remove: (id: string) => void },
    ][];
    const map = new Map<CollectionKey, Mutator>();
    entries.forEach(([key, value]) => {
      map.set(key, {
        update: (id, values) => value.update(id, values as Partial<BaseEntity>),
        remove: value.remove,
      });
    });
    return map;
  }, [
    appointments,
    cleaningtasks,
    documents,
    firechecks,
    inspections,
    legionella,
    maintenances,
    orders,
    playgroundchecks,
    rcd,
    solarplants,
  ]);

  const canEdit = useCallback(
    (event: CalendarEvent) => {
      const source = event.source;
      if (!source) return false;
      return mutators.has(source.collection) && access.canWrite(source.collection);
    },
    [access, mutators],
  );

  const canRemove = useCallback(
    (event: CalendarEvent) => {
      const source = event.source;
      if (!source) return false;
      return mutators.has(source.collection) && access.canDelete(source.collection);
    },
    [access, mutators],
  );

  const patch = useCallback(
    (event: CalendarEvent, values: Record<string, unknown>) => {
      if (!event.source || !canEdit(event)) return;
      mutators.get(event.source.collection)?.update(event.sourceId, values);
    },
    [canEdit, mutators],
  );

  const move = useCallback(
    (event: CalendarEvent, date: string) => {
      if (!event.source || !date) return;
      patch(event, { [event.source.field]: date });
    },
    [patch],
  );

  const remove = useCallback(
    (event: CalendarEvent) => {
      if (!event.source || !canRemove(event)) return;
      mutators.get(event.source.collection)?.remove(event.sourceId);
    },
    [canRemove, mutators],
  );

  return useMemo(
    () => ({ canEdit, canRemove, move, patch, remove }),
    [canEdit, canRemove, move, patch, remove],
  );
}
