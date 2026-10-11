'use client';

/**
 * Erinnerungen im Hintergrund.
 *
 * Prueft beim Start und danach regelmaessig, was heute faellig ist, und
 * meldet es als Mitteilung. Zeigt selbst nichts an.
 */
import { useCallback } from 'react';

import { useAccess } from '@/lib/auth/scope';
import { useRelevantEvents } from '@/lib/calendar/relevant';
import { indexOf, useAllCollections, useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { isClosedStatus } from '@/lib/module-status';
import { moduleByCollection } from '@/lib/modules';
import { CollectionKey, NotifyEvent } from '@/lib/types';
import { reminderText } from '@/lib/notifications/reminders';
import { useDueReminders } from '@/lib/notifications/reminders';
import { useSettings } from '@/lib/settings/provider';
import { today } from '@/lib/utils/format';

/** Module, deren Zuweisung eine Mitteilung ausloest. */
const ASSIGNABLE: CollectionKey[] = [
  'tickets',
  'orders',
  'damages',
  'maintenances',
  'inspections',
  'rcd',
  'firechecks',
  'playgroundchecks',
  'cleaningtasks',
];

const SINCE_KEY = 'facility365.v2.notifySince';
const STATUS_KEY = 'facility365.v2.notifyStatus';

/** Erster Start auf diesem Geraet; aeltere Datensaetze gelten nicht als neu. */
const notifySince = (): string => {
  try {
    const stored = window.localStorage.getItem(SINCE_KEY);
    if (stored) return stored;
    const now = new Date().toISOString();
    window.localStorage.setItem(SINCE_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
};

const readStatusMap = (): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem(STATUS_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
};

const writeStatusMap = (map: Record<string, string>) => {
  try {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {
    /* Speicher voll: Statuswechsel werden dann erst spaeter erkannt. */
  }
};

export function Reminders() {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const events = useRelevantEvents();
  const store = useAllCollections();
  const buildings = useCollectionItems('buildings');
  const properties = useCollectionItems('properties');
  const buildingIndex = indexOf(buildings);
  const propertyIndex = indexOf(properties);

  /**
   * Neu zugewiesene Vorgaenge.
   *
   * Jede Zuweisung meldet sich einmal; erledigte Vorgaenge bleiben still.
   */
  const assigned = useCallback(() => {
    const userId = access.user?.id ?? '';
    if (!userId) return [];
    return ASSIGNABLE.filter((collection) => access.canRead(collection)).flatMap(
      (collection) =>
        store[collection]
          .filter(
            (item) =>
              !item.deletedAt &&
              stringField(item, 'assigneeUserId') === userId &&
              !isClosedStatus(collection, stringField(item, 'status')) &&
              access.visible(collection, item),
          )
          .map((item) => ({
            key: `assigned-${collection}-${item.id}`,
            title: `${t('notify.assigned')}: ${titleOfEntity(collection, item)}`,
            body: `${t(moduleByCollection(collection).singularKey)} · ${item.number}`,
            href: `${moduleByCollection(collection).path}/${item.id}`,
          })),
    );
  }, [access, store, t]);

  const wants = useCallback(
    (event: NotifyEvent) => settings.notificationEvents?.[event] !== false,
    [settings.notificationEvents],
  );

  /** Neue Auftraege und Meldungen seit dem ersten Start auf diesem Geraet. */
  const fresh = useCallback(() => {
    const since = notifySince();
    const userId = access.user?.id ?? '';
    const sources: { collection: CollectionKey; event: NotifyEvent; label: string }[] = [
      { collection: 'orders', event: 'newOrders', label: t('notify.newOrder') },
      { collection: 'damages', event: 'reports', label: t('notify.newReport') },
      { collection: 'tickets', event: 'reports', label: t('notify.newReport') },
    ];
    return sources
      .filter((source) => wants(source.event) && access.canRead(source.collection))
      .flatMap((source) =>
        store[source.collection]
          .filter(
            (item) =>
              !item.deletedAt &&
              item.createdAt > since &&
              /** Eigene Zuweisungen meldet bereits „Zugewiesen“. */
              !(userId && stringField(item, 'assigneeUserId') === userId) &&
              !isClosedStatus(source.collection, stringField(item, 'status')) &&
              access.visible(source.collection, item),
          )
          .map((item) => ({
            key: `new-${source.collection}-${item.id}`,
            title: `${source.label}: ${titleOfEntity(source.collection, item)}`,
            body: `${t(moduleByCollection(source.collection).singularKey)} · ${item.number}`,
            href: `${moduleByCollection(source.collection).path}/${item.id}`,
          })),
      );
  }, [access, store, t, wants]);

  /** Statuswechsel eigener Vorgaenge; der erste Stand gilt als bekannt. */
  const statusChanges = useCallback(() => {
    if (!wants('status')) return [];
    const userId = access.user?.id ?? '';
    const known = readStatusMap();
    const next: Record<string, string> = {};
    const changes: { key: string; title: string; body: string; href: string }[] = [];
    (['orders', 'tickets', 'damages'] as CollectionKey[])
      .filter((collection) => access.canRead(collection))
      .forEach((collection) => {
        store[collection]
          .filter(
            (item) =>
              !item.deletedAt &&
              (!userId || stringField(item, 'assigneeUserId') === userId) &&
              access.visible(collection, item),
          )
          .forEach((item) => {
            const id = `${collection}-${item.id}`;
            const status = stringField(item, 'status');
            next[id] = status;
            if (known[id] !== undefined && known[id] !== status) {
              const option = configOf(collection).statusOptions?.find(
                (entry) => entry.value === status,
              );
              changes.push({
                key: `status-${id}-${status}-${item.updatedAt}`,
                title: `${t('notify.statusChanged')}: ${titleOfEntity(collection, item)}`,
                body: option ? t(option.labelKey) : status,
                href: `${moduleByCollection(collection).path}/${item.id}`,
              });
            }
          });
      });
    writeStatusMap(next);
    return changes;
  }, [access, store, t, wants]);

  const pending = useCallback(() => {
    const day = today();
    return [
      ...(wants('assigned') ? assigned() : []),
      ...fresh(),
      ...statusChanges(),
      ...(wants('maintenance') ? events : [])
        .filter((event) => event.date <= day)
        .map((event) => {
          const place =
            buildingIndex.get(event.buildingId)?.name ??
            propertyIndex.get(event.propertyId)?.name ??
            '';
          const { title, body } = reminderText(
            event,
            place,
            { dueToday: t('notify.dueToday'), overdue: t('notify.overdue') },
            day,
          );
          return { key: `${day}-${event.id}`, title, body, href: event.href };
        }),
    ];
  }, [assigned, buildingIndex, events, fresh, propertyIndex, statusChanges, t, wants]);

  useDueReminders(settings.notificationsEnabled, pending);

  return null;
}
