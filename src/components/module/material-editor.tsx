'use client';

/** Verbrauchtes Material mit Summe; Positionen frei oder aus dem Lager. */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { MaterialItem } from '@/lib/types';
import { formatMoney } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';

export function MaterialEditor({
  items,
  onChange,
}: {
  items: MaterialItem[];
  onChange: (items: MaterialItem[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const stock = useCollectionItems('stock');
  const empty = { name: '', quantity: '1', unit: 'Stk', price: '', stockItemId: '' };
  const [draft, setDraft] = useState(empty);
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const pickStock = (stockItemId: string) => {
    const item = stock.find((entry) => entry.id === stockItemId);
    if (!item) {
      setDraft({ ...draft, stockItemId: '' });
      return;
    }
    setDraft({
      ...draft,
      stockItemId,
      name: item.title,
      unit: item.unit || 'Stk',
      price: typeof item.price === 'number' ? String(item.price) : '',
    });
  };

  const add = () => {
    const name = draft.name.trim();
    if (!name) return;
    onChange([
      ...items,
      {
        id: newId('mat'),
        name,
        quantity: Number(draft.quantity.replace(',', '.')) || 0,
        unit: draft.unit,
        price: Number(draft.price.replace(',', '.')) || 0,
        ...(draft.stockItemId ? { stockItemId: draft.stockItemId } : {}),
      },
    ]);
    setDraft(empty);
  };

  return (
    <section className="flex flex-col gap-3" data-testid="material-editor">
      {items.length === 0 ? (
        <EmptyState titleKey="list.empty" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.quantity} {item.unit} · {formatMoney(item.price, settings.currency)}
                </span>
              </span>
              <span className="text-sm font-medium">
                {formatMoney(item.quantity * item.price, settings.currency)}
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
          <li className="flex items-center justify-between p-3 font-medium">
            <span>{t('common.total')}</span>
            <span data-testid="material-total">{formatMoney(total, settings.currency)}</span>
          </li>
        </ul>
      )}

      {stock.length > 0 ? (
        <Select value={draft.stockItemId || 'none'} onValueChange={(value) => pickStock(value === 'none' ? '' : value)}>
          <SelectTrigger data-testid="material-stock" aria-label={t('material.fromStock')}>
            <SelectValue placeholder={t('material.fromStock')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('material.fromStock')}</SelectItem>
            {stock.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {[item.articleNumber, item.title].filter(Boolean).join(' · ')}
                {typeof item.price === 'number' ? ` – ${formatMoney(item.price, settings.currency)}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Input
          className="col-span-2"
          placeholder={t('common.name')}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value, stockItemId: '' })}
          data-testid="material-name"
        />
        <Input
          inputMode="decimal"
          placeholder={t('common.quantity')}
          value={draft.quantity}
          onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
          data-testid="material-quantity"
        />
        <Input
          inputMode="decimal"
          placeholder={t('common.price')}
          value={draft.price}
          onChange={(event) => setDraft({ ...draft, price: event.target.value })}
          data-testid="material-price"
        />
        <Button onClick={add} data-testid="material-add">
          <Plus className="size-4" aria-hidden />
          {t('action.add')}
        </Button>
      </div>
    </section>
  );
}
