'use client';

/**
 * Folgevorgaenge aus einem beliebigen Modul.
 *
 * Aus einem Schaden, einer Wartung, einer Kontrolle oder einer Reinigung
 * entsteht mit einem Klick ein Auftrag oder ein Ticket. Uebernommen wird alles,
 * was schon erfasst ist: Kunde, Objekthierarchie, Anlage, Zustaendige,
 * Prioritaet, Frist, Beschreibung und Fotos - damit dieselbe Information nie
 * zweimal eingegeben werden muss.
 *
 * Der neue Datensatz merkt sich seine Herkunft (Modul und Kennung). Dadurch
 * fuehrt der Weg in beide Richtungen: vom Auftrag zurueck zur Kontrolle und von
 * der Kontrolle zu allen daraus entstandenen Auftraegen und Tickets.
 */
import { useCallback, useMemo } from 'react';

import { useCollection, useCollectionItems } from '@/lib/data/store';
import { fieldValue, stringField } from '@/lib/entity-values';
import { titleOfEntity } from '@/lib/module-config';
import { BaseEntity, CollectionKey, Order, Priority, Ticket } from '@/lib/types';
import { newId } from '@/lib/utils/id';

/** Module, aus denen sich ein Auftrag oder Ticket ableiten laesst. */
export const FOLLOW_UP_SOURCES: CollectionKey[] = [
  'damages',
  'tickets',
  'maintenances',
  'inspections',
  'rcd',
  'legionella',
  'cleaningtasks',
  'cleaningchecks',
  'cleaningcomplaints',
  'firechecks',
  'playgroundchecks',
  'contracts',
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

const priorityOf = (entity: BaseEntity): Priority => {
  const value = stringField(entity, 'priority');
  return PRIORITIES.includes(value as Priority) ? (value as Priority) : 'medium';
};

/** Erste gefuellte Angabe aus mehreren moeglichen Feldern. */
const firstOf = (entity: BaseEntity, names: string[]): string => {
  for (const name of names) {
    const value = stringField(entity, name);
    if (value) return value;
  }
  return '';
};

const descriptionOf = (entity: BaseEntity): string =>
  [
    firstOf(entity, ['description', 'defects', 'summary', 'measures']),
    stringField(entity, 'notes'),
  ]
    .filter(Boolean)
    .join('\n\n');

/** Gemeinsame Angaben, die jeder Folgevorgang uebernimmt. */
const commonValues = (collection: CollectionKey, entity: BaseEntity) => ({
  title: titleOfEntity(collection, entity) || entity.number,
  description: descriptionOf(entity),
  priority: priorityOf(entity),
  customerId: stringField(entity, 'customerId'),
  propertyId: stringField(entity, 'propertyId'),
  buildingId: stringField(entity, 'buildingId'),
  roomId: stringField(entity, 'roomId'),
  assetId: stringField(entity, 'assetId'),
  assigneeUserId: stringField(entity, 'assigneeUserId'),
  dueDate: firstOf(entity, ['dueDate', 'nextDate', 'date']),
  /** Fotos werden kopiert, damit der Vorgang fuer sich vollstaendig bleibt. */
  photos: entity.photos.map((photo) => ({ ...photo, id: newId('pho') })),
  sourceCollection: collection,
  sourceId: entity.id,
});

/** Auftragswerte aus einem beliebigen Datensatz. */
export const orderValuesFromSource = (
  collection: CollectionKey,
  entity: BaseEntity,
): Partial<Order> => ({
  ...commonValues(collection, entity),
  status: 'new',
  supplierId: stringField(entity, 'supplierId'),
  assigneeTeam: stringField(entity, 'assigneeTeam'),
});

/** Ticketwerte aus einem beliebigen Datensatz. */
export const ticketValuesFromSource = (
  collection: CollectionKey,
  entity: BaseEntity,
): Partial<Ticket> => ({
  ...commonValues(collection, entity),
  status: 'new',
  category: collection === 'damages' ? 'damage' : 'fault',
  organizationId: stringField(entity, 'organizationId'),
  siteId: stringField(entity, 'siteId'),
  reportedBy: firstOf(entity, ['reportedBy', 'inspector', 'tester', 'responsible']),
  reportedAt: firstOf(entity, ['date', 'reportedAt']),
});

export interface FollowUpApi {
  /** Auftraege, die aus diesem Datensatz entstanden sind. */
  orders: (collection: CollectionKey, entity: BaseEntity) => Order[];
  /** Tickets, die aus diesem Datensatz entstanden sind. */
  tickets: (collection: CollectionKey, entity: BaseEntity) => Ticket[];
  createOrder: (collection: CollectionKey, entity: BaseEntity) => Order;
  createTicket: (collection: CollectionKey, entity: BaseEntity) => Ticket;
}

export function useFollowUp(): FollowUpApi {
  const orderApi = useCollection('orders');
  const ticketApi = useCollection('tickets');

  const orders = useCallback(
    (collection: CollectionKey, entity: BaseEntity) =>
      orderApi.items.filter(
        (order) =>
          order.sourceCollection === collection && order.sourceId === entity.id,
      ),
    [orderApi.items],
  );

  const tickets = useCallback(
    (collection: CollectionKey, entity: BaseEntity) =>
      ticketApi.items.filter(
        (ticket) =>
          ticket.sourceCollection === collection &&
          ticket.sourceId === entity.id,
      ),
    [ticketApi.items],
  );

  const createOrder = useCallback(
    (collection: CollectionKey, entity: BaseEntity) =>
      orderApi.create(orderValuesFromSource(collection, entity)),
    [orderApi],
  );

  const createTicket = useCallback(
    (collection: CollectionKey, entity: BaseEntity) =>
      ticketApi.create(ticketValuesFromSource(collection, entity)),
    [ticketApi],
  );

  return { orders, tickets, createOrder, createTicket };
}

export interface SourceRef {
  collection: CollectionKey;
  id: string;
}

/** Herkunft eines Datensatzes, sofern er aus einem anderen Modul entstand. */
export const sourceRefOf = (entity: BaseEntity): SourceRef | undefined => {
  const collection = fieldValue(entity, 'sourceCollection');
  const id = fieldValue(entity, 'sourceId');
  if (typeof collection !== 'string' || typeof id !== 'string') return undefined;
  if (!collection || !id) return undefined;
  return { collection: collection as CollectionKey, id };
};

/** Rapporte eines Auftrags; sie tragen Arbeitszeit, Material und Kosten. */
export function useReportsOfOrder(orderId: string) {
  const reports = useCollectionItems('reports');
  return useMemo(
    () => (orderId ? reports.filter((report) => report.orderId === orderId) : []),
    [orderId, reports],
  );
}
