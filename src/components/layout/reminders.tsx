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
import { useAllCollections, useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { titleOfEntity } from '@/lib/module-config';
import { isClosedStatus } from '@/lib/module-status';
import { moduleByCollection } from '@/lib/modules';
import { CollectionKey } from '@/lib/types';
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

export function Reminders() {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const events = useRelevantEvents();
  const store = useAllCollections();
  const buildings = useCollectionItems('buildings');
  const properties = useCollectionItems('properties');

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

  const pending = useCallback(() => {
    const day = today();
    return [
      ...assigned(),
      ...events
      .filter((event) => event.date <= day)
      .map((event) => {
        const place =
          buildings.find((building) => building.id === event.buildingId)?.name ??
          properties.find((property) => property.id === event.propertyId)?.name ??
          '';
        const { title, body } = reminderText(event, place, {
          dueToday: t('notify.dueToday'),
          overdue: t('notify.overdue'),
        }, day);
          return { key: `${day}-${event.id}`, title, body, href: event.href };
        }),
    ];
  }, [assigned, buildings, events, properties, t]);

  useDueReminders(settings.notificationsEnabled, pending);

  return null;
}
