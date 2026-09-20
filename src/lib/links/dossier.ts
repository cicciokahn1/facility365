'use client';

/**
 * Dossier eines Objekts.
 *
 * Sammelt zu einer Liegenschaft, einem Gebaeude, einem Raum oder einer Anlage
 * saemtliche Vorgaenge aus allen Modulen - Tickets, Auftraege, Schaeden,
 * Wartungen, Kontrollen, Reinigung, Rapporte, Dokumente, Termine, Offerten und
 * Rechnungen. Welche Sammlung dazugehoert, ergibt sich aus den Beziehungsfeldern
 * der Modulkonfiguration; neue Module erscheinen dadurch von selbst.
 *
 * Untergeordnete Objekte zaehlen mit: ein Gebaeude zeigt auch die Vorgaenge
 * seiner Raeume und Anlagen. Damit ist der Weg Gebaeude → Raum → Anlage →
 * Ticket → Auftrag → Rapport → Kosten in beide Richtungen begehbar.
 */
import { useMemo } from 'react';

import { useAccess } from '@/lib/auth/scope';
import { useAllCollections, useCollectionItems } from '@/lib/data/store';
import { fieldValue, stringField } from '@/lib/entity-values';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { isClosedStatus } from '@/lib/module-status';
import { moduleByCollection } from '@/lib/modules';
import { workedHours } from '@/lib/reports/work-time';
import { BaseEntity, CollectionKey, MaterialItem } from '@/lib/types';

/** Ebene, zu der ein Dossier gehoert. */
export type DossierLevel =
  | 'organizations'
  | 'customers'
  | 'sites'
  | 'properties'
  | 'buildings'
  | 'rooms'
  | 'assets';

const OBJECT_FIELD_LEVEL: Record<string, DossierLevel> = {
  organizationId: 'organizations',
  customerId: 'customers',
  siteId: 'sites',
  propertyId: 'properties',
  buildingId: 'buildings',
  roomId: 'rooms',
  assetId: 'assets',
};
const OBJECT_COLLECTIONS: CollectionKey[] = [
  'organizations',
  'customers',
  'sites',
  'properties',
  'buildings',
  'rooms',
  'assets',
];

/** Sammlungen, die nie im Dossier stehen: Stammdaten und Protokolle. */
const EXCLUDED: CollectionKey[] = [
  'customers',
  'suppliers',
  'sources',
  'organizations',
  'sites',
  'properties',
  'buildings',
  'rooms',
  'assets',
  'users',
  'activities',
];

export interface DossierEntry {
  key: string;
  collection: CollectionKey;
  id: string;
  number: string;
  title: string;
  /** Fachliches Datum des Vorgangs; sonst der Tag der Erfassung. */
  date: string;
  status: string;
  done: boolean;
  /** Faelligkeit, sofern das Modul eine kennt. */
  dueDate: string;
  path: string;
  /** Kosten aus Material und Positionen. */
  cost: number;
  /** Erfasste Arbeitszeit in Stunden. */
  hours: number;
  photoCount: number;
  documentCount: number;
}

export interface Dossier {
  entries: DossierEntry[];
  open: DossierEntry[];
  overdue: DossierEntry[];
  /** Kommende Termine und Fristen, aufsteigend. */
  upcoming: DossierEntry[];
  cost: number;
  hours: number;
  /** Anzahl je Modul, unabhaengig vom Zustand. */
  countByCollection: [CollectionKey, number][];
}

const numberField = (entity: BaseEntity, name: string): number => {
  const value = fieldValue(entity, name);
  return typeof value === 'number' ? value : 0;
};

const isMaterialList = (value: unknown): value is MaterialItem[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'quantity' in item &&
      'price' in item,
  );

/** Erfasste Arbeitszeit eines Datensatzes in Stunden. */
const hoursOf = (entity: BaseEntity): number => {
  const start = stringField(entity, 'workStart');
  const end = stringField(entity, 'workEnd');
  if (!start || !end) return 0;
  return workedHours({
    start,
    end,
    breakMinutes: numberField(entity, 'breakMinutes'),
  });
};

const sumOf = (value: unknown): number =>
  isMaterialList(value)
    ? value.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
        0,
      )
    : 0;

const sumLineItems = (value: unknown): number =>
  Array.isArray(value)
    ? value.reduce((sum, item) => {
        if (typeof item !== 'object' || item === null) return sum;
        const quantity = 'quantity' in item && typeof item.quantity === 'number' ? item.quantity : 0;
        const unitPrice =
          'unitPrice' in item && typeof item.unitPrice === 'number' ? item.unitPrice : 0;
        return sum + quantity * unitPrice;
      }, 0)
    : 0;

/** Kosten eines Datensatzes aus Positionen oder aus Arbeitszeit, Material und Fremdleistungen. */
const costOf = (entity: BaseEntity): number => {
  const total = numberField(entity, 'total');
  if (total > 0) return total;
  return (
    hoursOf(entity) * numberField(entity, 'hourlyRate') +
    sumOf(fieldValue(entity, 'materials')) +
    sumOf(fieldValue(entity, 'externalServices')) +
    sumLineItems(fieldValue(entity, 'items'))
  );
};

/** Das erste Datumsfeld eines Moduls fuehrt den Vorgang zeitlich. */
const dateFieldsOf = (collection: CollectionKey): string[] =>
  configOf(collection)
    .fields.filter((field) => field.kind === 'date')
    .map((field) => field.name);

/** Beziehungsfelder eines Moduls auf Liegenschaft, Gebaeude, Raum und Anlage. */
type ObjectField = { name: string; level: DossierLevel };
const OBJECT_FIELD_CACHE = new Map<CollectionKey, ObjectField[]>();

const objectFieldsOf = (collection: CollectionKey): ObjectField[] => {
  const cached = OBJECT_FIELD_CACHE.get(collection);
  if (cached) return cached;
  const fields: ObjectField[] = [];
  for (const field of configOf(collection).fields) {
    if (
      field.kind !== 'relation' ||
      !OBJECT_COLLECTIONS.includes(field.collection)
    )
      continue;
    const level = OBJECT_FIELD_LEVEL[field.name];
    if (level) fields.push({ name: field.name, level });
  }
  OBJECT_FIELD_CACHE.set(collection, fields);
  return fields;
};

/**
 * Dossier eines Objekts samt untergeordneter Objekte.
 *
 * Gezeigt wird nur, was die Rolle sehen darf; geloeschte Datensaetze liegen im
 * Papierkorb und erscheinen wie ueberall nicht.
 */
export function useDossier(level: DossierLevel, id: string): Dossier {
  const store = useAllCollections();
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const access = useAccess();

  return useMemo(() => {
    /** Zu jedem Objekt auch die untergeordneten Kennungen sammeln. */
    const ids: Record<DossierLevel, Set<string>> = {
      organizations: new Set<string>(),
      customers: new Set<string>(),
      sites: new Set<string>(),
      properties: new Set<string>(),
      buildings: new Set<string>(),
      rooms: new Set<string>(),
      assets: new Set<string>(),
    };
    ids[level].add(id);

    const sites = store.sites;
    const properties = store.properties;

    sites
      .filter(
        (site) =>
          ids.organizations.has(stringField(site, 'organizationId')) ||
          ids.customers.has(stringField(site, 'customerId')),
      )
      .forEach((site) => ids.sites.add(site.id));
    properties
      .filter(
        (property) =>
          ids.customers.has(stringField(property, 'customerId')) ||
          ids.sites.has(stringField(property, 'siteId')),
      )
      .forEach((property) => ids.properties.add(property.id));
    buildings
      .filter((building) => ids.properties.has(building.propertyId))
      .forEach((building) => ids.buildings.add(building.id));
    rooms
      .filter((room) => ids.buildings.has(room.buildingId))
      .forEach((room) => ids.rooms.add(room.id));
    assets
      .filter(
        (asset) =>
          ids.properties.has(asset.propertyId) ||
          ids.buildings.has(asset.buildingId) ||
          ids.rooms.has(asset.roomId),
      )
      .forEach((asset) => ids.assets.add(asset.id));

    const objectFields = new Map(
      (Object.keys(store) as CollectionKey[]).map((collection) => [
        collection,
        objectFieldsOf(collection),
      ]),
    );
    const matches = (collection: CollectionKey, item: BaseEntity): boolean =>
      (objectFields.get(collection) ?? []).some(({ name, level: target }) => {
        const value = stringField(item, name);
        if (!value) return false;
        return ids[target].has(value);
      });

    const entries: DossierEntry[] = [];
    (Object.keys(store) as CollectionKey[]).forEach((collection) => {
      if (EXCLUDED.includes(collection)) return;
      if (!access.canRead(collection)) return;
      const config = configOf(collection);
      const dates = dateFieldsOf(collection);
      const moduleDef = moduleByCollection(collection);
      store[collection].forEach((item) => {
        if (item.deletedAt) return;
        if (!matches(collection, item)) return;
        if (!access.visible(collection, item)) return;
        const status = config.statusField
          ? stringField(item, config.statusField)
          : '';
        const date =
          dates.map((name) => stringField(item, name)).find(Boolean) ??
          item.createdAt.slice(0, 10);
        entries.push({
          key: `${collection}-${item.id}`,
          collection,
          id: item.id,
          number: item.number,
          title: titleOfEntity(collection, item) || item.number,
          date,
          status,
          done: Boolean(status) && isClosedStatus(collection, status),
          dueDate:
            stringField(item, 'dueDate') || stringField(item, 'nextDate'),
          path: `${moduleDef.path}/${item.id}`,
          cost: costOf(item),
          hours: hoursOf(item),
          photoCount: item.photos.length,
          documentCount: item.documents.length,
        });
      });
    });

    entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    const open = entries.filter((entry) => !entry.done);
    const day = new Date().toISOString().slice(0, 10);
    const counts = new Map<CollectionKey, number>();
    entries.forEach((entry) =>
      counts.set(entry.collection, (counts.get(entry.collection) ?? 0) + 1),
    );

    return {
      entries,
      open,
      overdue: open.filter((entry) => entry.dueDate && entry.dueDate < day),
      upcoming: open
        .filter((entry) => entry.dueDate && entry.dueDate >= day)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
      cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
      hours:
        Math.round(entries.reduce((sum, entry) => sum + entry.hours, 0) * 100) /
        100,
      countByCollection: [...counts.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [access, assets, buildings, id, level, rooms, store]);
}
