'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { LineItemEditor } from '@/components/module/line-item-editor';
import { InvoicePdfPanel } from '@/components/modules/invoice-pdf-panel';

export function InvoiceDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="invoices"
      id={id}
      extraTabs={(invoice, update) => [
        {
          value: 'items',
          labelKey: 'tab.items',
          content: (
            <LineItemEditor
              items={invoice.items}
              currency={invoice.currency || 'CHF'}
              onChange={(items) => update({ items })}
            />
          ),
        },
        {
          value: 'pdf',
          labelKey: 'tab.pdf',
          content: <InvoicePdfPanel invoice={invoice} />,
        },
      ]}
    />
  );
}
