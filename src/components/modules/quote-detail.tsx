'use client';

import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

import { EntityDetail } from '@/components/module/entity-detail';
import { LineItemEditor } from '@/components/module/line-item-editor';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { useOrderFromQuote } from '@/lib/quotes/to-order';

export function QuoteDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const orders = useOrderFromQuote();

  return (
    <EntityDetail
      collection="quotes"
      id={id}
      headerExtra={(quote) => {
        const existing = orders.existing(quote.id);
        /** Der Weg beginnt erst mit der Annahme; vorher gibt es nichts auszufuehren. */
        if (quote.status !== 'accepted' && !existing) return null;
        return (
          <Button
            size="sm"
            variant={existing ? 'outline' : 'default'}
            onClick={() => {
              if (existing) {
                router.push(`/orders/${existing.id}`);
                return;
              }
              const order = orders.create(quote);
              toast.success(t('quote.orderCreated'), { description: t('quote.orderHint') });
              router.push(`/orders/${order.id}`);
            }}
            data-testid="quote-create-order"
          >
            <ClipboardList className="size-4" aria-hidden />
            {existing ? t('quote.openOrder') : t('quote.createOrder')}
          </Button>
        );
      }}
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
