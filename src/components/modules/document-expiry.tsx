'use client';

/** Dokumente, deren Gueltigkeit abgelaufen ist oder demnaechst ablaeuft. */
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { documentExpiryState } from '@/lib/documents/expiry';
import { formatDate, today } from '@/lib/utils/format';

export function DocumentExpiry() {
  const t = useT();
  const { settings } = useSettings();
  const documents = useCollectionItems('documents');
  const now = today();
  const due = documents
    .map((document) => ({ document, state: documentExpiryState(document.validUntil, now) }))
    .filter((entry) => entry.state !== 'valid');

  if (due.length === 0) return null;

  return (
    <Card className="border-amber-500/40" data-testid="document-expiry">
      <CardHeader className="flex flex-row items-center gap-2">
        <CalendarClock className="size-4 text-amber-600" aria-hidden />
        <CardTitle className="text-base text-amber-700 dark:text-amber-500">
          {t('documents.expiryTitle')} ({due.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {due.map(({ document, state }) => (
          <Link
            key={document.id}
            href={`/documents/${document.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
            data-testid="document-expiry-item"
          >
            <span className="font-medium">{document.title || document.number}</span>
            <span className={state === 'expired' ? 'text-destructive' : 'text-muted-foreground'}>
              {t(state === 'expired' ? 'documents.expired' : 'documents.expiring')} ·{' '}
              {t('documents.validUntil')}: {formatDate(document.validUntil, settings.language)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
