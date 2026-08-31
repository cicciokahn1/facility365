'use client';

/**
 * Abgleich zwischen Facility365 und Microsoft 365.
 *
 * Der Abgleich laeuft in beide Richtungen: Auftraege mit Termin erscheinen im
 * Outlook-Kalender, Aenderungen in Outlook kehren in den Auftrag zurueck. Es
 * wird nichts geloescht - weder in Facility365 noch in Outlook; bei
 * gleichzeitigen Aenderungen gilt die juengere.
 */
import { useCallback, useMemo } from 'react';

import { useCollection, useCollectionItems } from '@/lib/data/store';
import {
  EventDraft,
  GRAPH_CATEGORY,
  GraphEvent,
  GraphMessage,
  createEvent,
  listEvents,
  markMessageHandled,
  updateEvent,
} from '@/lib/integrations/microsoft/graph';
import { GraphConfig } from '@/lib/integrations/microsoft/auth';
import { AppUser, Building, Order, Property, Room } from '@/lib/types';
import { isDone } from '@/lib/workflow/complete';

/** Standort eines Auftrags als Text - so steht er als Ort im Outlook-Termin. */
export const locationText = (
  order: Pick<Order, 'propertyId' | 'buildingId' | 'roomId'>,
  properties: Property[],
  buildings: Building[],
  rooms: Room[],
): string =>
  [
    properties.find((item) => item.id === order.propertyId)?.name,
    buildings.find((item) => item.id === order.buildingId)?.name,
    rooms.find((item) => item.id === order.roomId)?.name,
  ]
    .filter(Boolean)
    .join(' · ');

const normalize = (value: string): string => value.trim().toLowerCase();

export interface PlaceMatch {
  propertyId: string;
  buildingId: string;
  roomId: string;
}

/**
 * Ort aus Outlook den bestehenden Objekten zuordnen.
 *
 * Der Ortstext wird an Trennzeichen zerlegt und mit Raum, Gebaeude und
 * Liegenschaft verglichen. Was sich nicht zuordnen laesst, bleibt leer.
 */
export const matchPlace = (
  location: string,
  properties: Property[],
  buildings: Building[],
  rooms: Room[],
): PlaceMatch => {
  const parts = location
    .split(/[·,;|/\-–]+/)
    .map((part) => normalize(part))
    .filter(Boolean);
  const hit = (name: string) => parts.some((part) => part === name || part.includes(name));

  const room = rooms.find((item) => item.name && hit(normalize(item.name)));
  const building =
    buildings.find((item) => room && item.id === room.buildingId) ??
    buildings.find((item) => item.name && hit(normalize(item.name)));
  const property =
    properties.find((item) => building && item.id === building.propertyId) ??
    properties.find((item) => item.name && hit(normalize(item.name)));

  return {
    propertyId: property?.id ?? '',
    buildingId: building?.id ?? '',
    roomId: room?.id ?? '',
  };
};

/** Verantwortliche Person aus den Teilnehmenden des Termins. */
export const matchUser = (addresses: string[], users: AppUser[]): AppUser | undefined => {
  const wanted = addresses.map(normalize).filter(Boolean);
  return users.find((user) => user.email && wanted.includes(normalize(user.email)));
};

const draftOf = (
  order: Order,
  properties: Property[],
  buildings: Building[],
  rooms: Room[],
  origin: string,
): EventDraft => ({
  subject: `${order.number} ${order.title}`.trim(),
  body: [order.description, `${origin}/orders/${order.id}`].filter(Boolean).join('\n\n'),
  location: locationText(order, properties, buildings, rooms),
  date: order.dueDate,
  time: order.workStart,
});

export interface SyncResult {
  pushed: number;
  updatedInOutlook: number;
  pulled: number;
  /** Termine aus Outlook, die noch zu keinem Auftrag gehoeren. */
  open: GraphEvent[];
}

/**
 * Wurde nach dem letzten Abgleich geaendert?
 *
 * Die Spanne von fuenf Sekunden faengt ab, dass der Abgleich selbst als
 * Aenderung gilt und die beiden Seiten sich gegenseitig aufschaukeln.
 */
const laterThan = (a: string, b: string): boolean =>
  Boolean(a) && (!b || new Date(a).getTime() > new Date(b).getTime() + 5_000);

const syncWindow = (days: number): [string, string] => {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + days);
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
};

/** Abgleich der Termine und Uebernahme von Nachrichten. */
export function useMicrosoftSync(config: GraphConfig) {
  const orders = useCollection('orders');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const users = useCollectionItems('users');

  const origin = typeof globalThis.location === 'undefined' ? '' : globalThis.location.origin;
  const items = orders.items;

  /** Offene Auftraege mit Termin; erledigte werden nicht mehr abgeglichen. */
  const plannable = useMemo(
    () => items.filter((order) => order.dueDate && !isDone('orders', order.status)),
    [items],
  );

  const syncCalendar = useCallback(
    async (days: number): Promise<SyncResult> => {
      const [from, to] = syncWindow(days);
      const events = await listEvents(config, from, to);
      const byId = new Map(events.map((event) => [event.id, event]));
      const result: SyncResult = { pushed: 0, updatedInOutlook: 0, pulled: 0, open: [] };
      const now = new Date().toISOString();

      for (const order of plannable) {
        const draft = draftOf(order, properties, buildings, rooms, origin);
        const event = order.graphEventId ? byId.get(order.graphEventId) : undefined;

        if (!order.graphEventId || !event) {
          /** Neuer Termin in Outlook; die Kennung bleibt am Auftrag. */
          const id = await createEvent(config, draft);
          orders.update(order.id, { graphEventId: id, graphSyncedAt: now } as Partial<Order>);
          result.pushed += 1;
          continue;
        }

        /** Beide Seiten geaendert: die juengere Aenderung gilt. */
        const outlookNewer = laterThan(event.lastModified, order.graphSyncedAt ?? '');
        const facilityNewer = laterThan(order.updatedAt, order.graphSyncedAt ?? '');

        if (outlookNewer && !facilityNewer) {
          const place = matchPlace(event.location, properties, buildings, rooms);
          const responsible = matchUser([event.organizer, ...event.attendees], users);
          orders.update(
            order.id,
            {
              dueDate: event.date || order.dueDate,
              workStart: event.time || order.workStart,
              workEnd: event.endTime || order.workEnd,
              propertyId: place.propertyId || order.propertyId,
              buildingId: place.buildingId || order.buildingId,
              roomId: place.roomId || order.roomId,
              assigneeUserId: responsible?.id ?? order.assigneeUserId,
              assignee: responsible?.name ?? order.assignee,
              graphSyncedAt: now,
            } as Partial<Order>,
            'history.microsoftSync',
          );
          result.pulled += 1;
          continue;
        }

        if (facilityNewer) {
          await updateEvent(config, event.id, draft);
          orders.update(order.id, { graphSyncedAt: now } as Partial<Order>);
          result.updatedInOutlook += 1;
        }
      }

      const linked = new Set(items.map((order) => order.graphEventId).filter(Boolean));
      result.open = events.filter(
        (event) => !linked.has(event.id) && !event.categories.includes(GRAPH_CATEGORY),
      );
      return result;
    },
    [buildings, config, items, orders, origin, plannable, properties, rooms, users],
  );

  /** Termin aus Outlook als Auftrag uebernehmen; der Termin bleibt bestehen. */
  const orderFromEvent = useCallback(
    (event: GraphEvent): Order => {
      const place = matchPlace(event.location, properties, buildings, rooms);
      const responsible = matchUser([event.organizer, ...event.attendees], users);
      return orders.create({
        title: event.subject,
        description: event.preview,
        dueDate: event.date,
        workStart: event.time,
        workEnd: event.endTime,
        propertyId: place.propertyId,
        buildingId: place.buildingId,
        roomId: place.roomId,
        assigneeUserId: responsible?.id ?? '',
        assignee: responsible?.name ?? '',
        graphEventId: event.id,
        graphSyncedAt: new Date().toISOString(),
      } as Partial<Order>);
    },
    [buildings, orders, properties, rooms, users],
  );

  /** Nachricht aus Outlook als Auftrag uebernehmen. */
  const orderFromMessage = useCallback(
    async (message: GraphMessage, values: Partial<Order>): Promise<Order> => {
      const created = orders.create({
        title: values.title || message.subject,
        description: [message.preview, message.fromName && `Outlook: ${message.fromName}`]
          .filter(Boolean)
          .join('\n\n'),
        graphMessageId: message.id,
        ...values,
      } as Partial<Order>);
      await markMessageHandled(config, message).catch(() => undefined);
      return created;
    },
    [config, orders],
  );

  return { syncCalendar, orderFromEvent, orderFromMessage };
}
