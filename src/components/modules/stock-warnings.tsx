'use client';

/**
 * Warnung der Lagerverwaltung.
 *
 * Zeigt alle Artikel, deren Bestand den Mindestbestand erreicht oder
 * unterschritten hat. Ohne erfassten Mindestbestand gibt es keine Warnung.
 */
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { StockItem } from '@/lib/types';

/** Wahr, sobald der Bestand den Mindestbestand erreicht oder unterschreitet. */
export const isLowStock = (item: StockItem): boolean =>
  typeof item.minQuantity === 'number' &&
  item.minQuantity > 0 &&
  (item.quantity ?? 0) <= item.minQuantity;

export function StockWarnings() {
  const t = useT();
  const items = useCollectionItems('stock');
  const low = items.filter(isLowStock);

  if (low.length === 0) return null;

  return (
    <Card className="border-destructive/40" data-testid="stock-warnings">
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="size-4 text-destructive" aria-hidden />
        <CardTitle className="text-base text-destructive">
          {t('stock.warningTitle')} ({low.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {low.map((item) => (
          <Link
            key={item.id}
            href={`/stock/${item.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
            data-testid="stock-warning-item"
          >
            <span className="font-medium">
              {item.title || item.articleNumber || item.number}
            </span>
            <span className="text-muted-foreground">
              {t('stock.quantity')}: {item.quantity ?? 0}
              {item.unit ? ` ${item.unit}` : ''} · {t('stock.minQuantity')}: {item.minQuantity}
              {item.unit ? ` ${item.unit}` : ''}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
