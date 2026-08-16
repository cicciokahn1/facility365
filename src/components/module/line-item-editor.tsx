'use client';

/** Positionen einer Offerte oder Rechnung inkl. Zwischensumme und MWST. */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { LineItem } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

export const lineItemTotals = (items: LineItem[]) => {
  const net = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vat = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.vatRate) / 100,
    0,
  );
  return { net, vat, gross: net + vat };
};

export function LineItemEditor({
  items,
  currency,
  onChange,
}: {
  items: LineItem[];
  currency: string;
  onChange: (items: LineItem[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [draft, setDraft] = useState({ description: '', quantity: '1', unitPrice: '' });
  const totals = lineItemTotals(items);

  const add = () => {
    const description = draft.description.trim();
    if (!description) return;
    onChange([
      ...items,
      {
        id: newId('pos'),
        position: items.length + 1,
        description,
        quantity: Number(draft.quantity.replace(',', '.')) || 0,
        unit: 'Stk',
        unitPrice: Number(draft.unitPrice.replace(',', '.')) || 0,
        vatRate: settings.vatRate,
      },
    ]);
    setDraft({ description: '', quantity: '1', unitPrice: '' });
  };

  return (
    <section className="flex flex-col gap-3" data-testid="line-items">
      {items.length === 0 ? (
        <EmptyState titleKey="invoice.noItems" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <span className="w-6 shrink-0 text-xs text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.description}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.quantity} × {formatMoney(item.unitPrice, currency)} · {item.vatRate}%
                </span>
              </span>
              <span className="text-sm font-medium">
                {formatMoney(item.quantity * item.unitPrice, currency)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t('action.delete')}
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
          <li className="space-y-1 p-3 text-sm">
            <p className="flex justify-between">
              <span>{t('invoice.subtotal')}</span>
              <span>{formatMoney(totals.net, currency)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>{t('invoice.vat')}</span>
              <span>{formatMoney(totals.vat, currency)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>{t('invoice.grandTotal')}</span>
              <span data-testid="line-items-total">{formatMoney(totals.gross, currency)}</span>
            </p>
          </li>
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input
          className="col-span-2"
          placeholder={t('common.description')}
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          data-testid="item-description"
        />
        <Input
          inputMode="decimal"
          placeholder={t('common.quantity')}
          value={draft.quantity}
          onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
          data-testid="item-quantity"
        />
        <Input
          inputMode="decimal"
          placeholder={t('common.price')}
          value={draft.unitPrice}
          onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })}
          data-testid="item-price"
        />
        <Button onClick={add} data-testid="item-add">
          <Plus className="size-4" aria-hidden />
          {t('action.add')}
        </Button>
      </div>
    </section>
  );
}
