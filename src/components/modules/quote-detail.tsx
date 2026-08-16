'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { LineItemEditor } from '@/components/module/line-item-editor';

export function QuoteDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="quotes"
      id={id}
      extraTabs={(quote, update) => [
        {
          value: 'items',
          labelKey: 'tab.items',
          content: (
            <LineItemEditor
              items={quote.items}
              currency={quote.currency || 'CHF'}
              onChange={(items) => update({ items })}
            />
          ),
        },
      ]}
    />
  );
}
