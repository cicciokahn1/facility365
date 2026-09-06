'use client';

/** Historie eines Datensatzes; neueste Aenderung zuoberst. */
import { History } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { table as keys } from '@/lib/i18n/generated/de';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { HistoryEntry } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/format';

const isKnownKey = (value: string): value is TranslationKey => value in keys;

export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  const t = useT();
  const { settings } = useSettings();
  if (entries.length === 0) return <EmptyState icon={History} titleKey="history.empty" />;

  return (
    <ol className="relative space-y-4 border-l pl-5" data-testid="history-list">
      {[...entries].reverse().map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-primary" />
          <p className="text-sm font-medium">
            {isKnownKey(entry.action) ? t(entry.action) : entry.action}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(entry.at, settings.language)}
            {entry.user ? ` · ${entry.user}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}
