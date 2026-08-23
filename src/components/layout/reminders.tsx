'use client';

/**
 * Erinnerungen im Hintergrund.
 *
 * Prueft beim Start und danach regelmaessig, was heute faellig ist, und
 * meldet es als Mitteilung. Zeigt selbst nichts an.
 */
import { useCallback } from 'react';

import { useRelevantEvents } from '@/lib/calendar/relevant';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { reminderText } from '@/lib/notifications/reminders';
import { useDueReminders } from '@/lib/notifications/reminders';
import { useSettings } from '@/lib/settings/provider';
import { today } from '@/lib/utils/format';

export function Reminders() {
  const t = useT();
  const { settings } = useSettings();
  const events = useRelevantEvents();
  const buildings = useCollectionItems('buildings');
  const properties = useCollectionItems('properties');

  const pending = useCallback(() => {
    const day = today();
    return events
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
      });
  }, [buildings, events, properties, t]);

  useDueReminders(settings.notificationsEnabled, pending);

  return null;
}
