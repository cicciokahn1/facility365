'use client';

/**
 * Termine, die die angemeldete Person etwas angehen.
 *
 * Grundlage bleibt der bestehende Kalender; hier faellt nur weg, was ausserhalb
 * der Rolle, der Organisation, der zugewiesenen Standorte oder der eigenen
 * Zustaendigkeit liegt. Damit sehen Kalender, «Heute» und die Mitteilungen
 * dieselbe Auswahl.
 */
import { useMemo } from 'react';

import { useAccess } from '@/lib/auth/scope';
import { CalendarEvent, CalendarEventKind, useCalendarEvents } from '@/lib/calendar/events';
import { useCollectionItems } from '@/lib/data/store';
import { BaseEntity, CollectionKey } from '@/lib/types';

const COLLECTION_OF: Record<CalendarEventKind, CollectionKey> = {
  order: 'orders',
  maintenance: 'maintenances',
  legionella: 'legionella',
  rcd: 'rcd',
  inspection: 'inspections',
  contract: 'contracts',
  cleaning: 'cleaningtasks',
};

export function useRelevantEvents(): CalendarEvent[] {
  const access = useAccess();
  const events = useCalendarEvents();
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const inspections = useCollectionItems('inspections');
  const contracts = useCollectionItems('contracts');
  const cleaningtasks = useCollectionItems('cleaningtasks');

  const sources = useMemo(() => {
    const map = new Map<CollectionKey, Map<string, BaseEntity>>();
    const add = (collection: CollectionKey, items: BaseEntity[]) =>
      map.set(collection, new Map(items.map((item) => [item.id, item])));
    add('orders', orders);
    add('maintenances', maintenances);
    add('legionella', legionella);
    add('rcd', rcd);
    add('inspections', inspections);
    add('contracts', contracts);
    add('cleaningtasks', cleaningtasks);
    return map;
  }, [cleaningtasks, contracts, inspections, legionella, maintenances, orders, rcd]);

  return useMemo(
    () =>
      events.filter((event) => {
        const collection = COLLECTION_OF[event.kind];
        if (!access.canRead(collection)) return false;
        const source = sources.get(collection)?.get(event.sourceId);
        /** Termine aus Plaenen ohne eigenen Datensatz: die Modulrechte genuegen. */
        if (!source) return !access.scope.ownOnly;
        return access.visible(collection, source);
      }),
    [access, events, sources],
  );
}
