'use client';

/** Artikel der Lagerverwaltung; warnt im Kopf bei zu tiefem Bestand. */
import { AlertTriangle } from 'lucide-react';

import { EntityDetail } from '@/components/module/entity-detail';
import { isLowStock } from '@/components/modules/stock-warnings';
import { useT } from '@/lib/i18n/provider';

export function StockDetail({ id }: { id: string }) {
  const t = useT();

  return (
    <EntityDetail
      collection="stock"
      id={id}
      headerExtra={(item) =>
        isLowStock(item) ? (
          <span
            className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm font-medium text-destructive"
            data-testid="stock-low-badge"
          >
            <AlertTriangle className="size-4" aria-hidden />
            {t('stock.warningTitle')}
          </span>
        ) : null
      }
    />
  );
}
