'use client';

/**
 * Daten, die an einer Person haengen.
 *
 * Sie entscheiden darueber, ob ein Benutzer geloescht werden darf: sobald ein
 * Auftrag, eine Wartung, ein Schaden, eine Reinigungsaufgabe oder ein
 * Aktivitaetseintrag auf ihn verweist, bleibt nur das Deaktivieren.
 */
import { useMemo } from 'react';

import { useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { titleOfEntity } from '@/lib/module-config';
import { BaseEntity, CollectionKey } from '@/lib/types';

export interface UserReference {
  collection: CollectionKey;
  id: string;
  number: string;
  title: string;
}

const FIELDS = ['assigneeUserId', 'reportedById'] as const;

export function useUserReferences(userId: string): UserReference[] {
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const damages = useCollectionItems('damages');
  const cleaningtasks = useCollectionItems('cleaningtasks');
  const activities = useCollectionItems('activities');

  return useMemo(() => {
    if (!userId) return [];
    const found: UserReference[] = [];
    const collect = (collection: CollectionKey, items: BaseEntity[]) => {
      items.forEach((item) => {
        if (!FIELDS.some((field) => stringField(item, field) === userId)) return;
        found.push({
          collection,
          id: item.id,
          number: item.number,
          title: titleOfEntity(collection, item),
        });
      });
    };
    collect('orders', orders);
    collect('maintenances', maintenances);
    collect('damages', damages);
    collect('cleaningtasks', cleaningtasks);
    activities
      .filter((activity) => activity.userId === userId)
      .forEach((activity) =>
        found.push({
          collection: 'activities',
          id: activity.id,
          number: activity.entityNumber || activity.number,
          title: activity.entityTitle,
        }),
      );
    return found;
  }, [activities, cleaningtasks, damages, maintenances, orders, userId]);
}
