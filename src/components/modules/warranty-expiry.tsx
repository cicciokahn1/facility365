'use client';

/** Garantien von Anlagen und Geraeten, die abgelaufen sind oder bald auslaufen. */
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { documentExpiryState } from '@/lib/documents/expiry';
import { formatDate, today } from '@/lib/utils/format';

export function WarrantyExpiry() {
  const t = useT();
  const { settings } = useSettings();
  const assets = useCollectionItems('assets');
  const inventory = useCollectionItems('inventory');
  const now = today();
  const due = [
    ...assets.map((item) => ({
      id: item.id,
      href: `/assets/${item.id}`,
      title: item.name || item.number,
      until: item.warrantyUntil,
    })),
    ...inventory.map((item) => ({
      id: item.id,
      href: `/inventory/${item.id}`,
      title: item.title || item.number,
      until: item.warrantyUntil,
    })),
  ]
    .map((item) => ({ ...item, state: documentExpiryState(item.until, now) }))
    .filter((entry) => entry.state !== 'valid');

  if (due.length === 0) return null;

  return (
    <Card className="border-warning/40" data-testid="warranty-expiry">
      <CardHeader className="flex flex-row items-center gap-2">
        <ShieldAlert className="size-4 text-warning" aria-hidden />
        <CardTitle className="text-base text-warning-foreground">
          {t('warranty.expiryTitle')} ({due.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {due.map((item) => (
          <Link
            key={`${item.href}`}
            href={item.href}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
            data-testid="warranty-expiry-item"
          >
            <span className="font-medium">{item.title}</span>
            <span className={item.state === 'expired' ? 'text-destructive' : 'text-muted-foreground'}>
              {t(item.state === 'expired' ? 'warranty.expired' : 'warranty.expiring')} ·{' '}
              {formatDate(item.until, settings.language)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
