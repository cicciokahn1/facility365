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
export type DossierLevel = 'properties' | 'buildings' | 'rooms' | 'assets';

/** Beziehungsfelder, ueber die ein Datensatz auf ein Objekt zeigt. */
const OBJECT_FIELDS: Record<DossierLevel, string> = {
  properties: 'propertyId',
  buildings: 'buildingId',
  rooms: 'roomId',
  assets: 'assetId',
};

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

/** Kosten eines Datensatzes aus Material oder Positionen. */
const costOf = (entity: BaseEntity): number => {
  const total = numberField(entity, 'total');
  if (total > 0) return total;
  const materials = fieldValue(entity, 'materials');
  if (!isMaterialList(materials)) return 0;
  return materials.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0,
  );
};

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

/** Das erste Datumsfeld eines Moduls fuehrt den Vorgang zeitlich. */
const dateFieldsOf = (collection: CollectionKey): string[] =>
  configOf(collection)
    .fields.filter((field) => field.kind === 'date')
    .map((field) => field.name);

/** Beziehungsfelder eines Moduls auf Liegenschaft, Gebaeude, Raum und Anlage. */
const objectFieldsOf = (collection: CollectionKey): string[] =>
  configOf(collection)
    .fields.filter(
      (field) =>
        field.kind === 'relation' &&
        (
          ['properties', 'buildings', 'rooms', 'assets'] as CollectionKey[]
        ).includes(field.collection),
    )
    .map((field) => field.name);

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
      properties: new Set(),
      buildings: new Set(),
      rooms: new Set(),
      assets: new Set(),
    };
    ids[level].add(id);

    if (level === 'properties') {
      buildings
        .filter((building) => building.propertyId === id)
        .forEach((building) => ids.buildings.add(building.id));
    }
    if (level === 'properties' || level === 'buildings') {
      rooms
        .filter((room) => ids.buildings.has(room.buildingId))
        .forEach((room) => ids.rooms.add(room.id));
    }
    if (level !== 'assets') {
      assets
        .filter(
          (asset) =>
            ids.properties.has(asset.propertyId) ||
            ids.buildings.has(asset.buildingId) ||
            ids.rooms.has(asset.roomId),
        )
        .forEach((asset) => ids.assets.add(asset.id));
    }

    const matches = (collection: CollectionKey, item: BaseEntity): boolean =>
      objectFieldsOf(collection).some((name) => {
        const value = stringField(item, name);
        if (!value) return false;
        const target = (Object.keys(OBJECT_FIELDS) as DossierLevel[]).find(
          (key) => OBJECT_FIELDS[key] === name,
        );
        return target ? ids[target].has(value) : false;
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
