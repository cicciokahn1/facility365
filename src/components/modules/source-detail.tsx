'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';

export function SourceDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="sources"
      id={id}
      extraTabs={() => [
        {
          value: 'inventory',
          labelKey: 'module.inventory',
          content: <RelatedList collection="inventory" field="sourceId" value={id} />,
        },
      ]}
    />
  );
}
