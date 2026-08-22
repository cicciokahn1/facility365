'use client';

/** Reinigungskraft mit ihren Plaenen, Aufgaben und Kontrollen. */
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';

export function CleanerDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="cleaners"
      id={id}
      extraTabs={(cleaner) => [
        {
          value: 'tasks',
          labelKey: 'module.cleaningtasks',
          content: <RelatedList collection="cleaningtasks" field="cleanerId" value={cleaner.id} />,
        },
        {
          value: 'plans',
          labelKey: 'module.cleaningplans',
          content: <RelatedList collection="cleaningplans" field="cleanerId" value={cleaner.id} />,
        },
        {
          value: 'checks',
          labelKey: 'module.cleaningchecks',
          content: (
            <RelatedList collection="cleaningchecks" field="inspectorId" value={cleaner.id} />
          ),
        },
      ]}
    />
  );
}
