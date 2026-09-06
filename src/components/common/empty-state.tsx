'use client';

import type { LucideIcon } from 'lucide-react';

import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';

/** Hinweis, wenn eine Liste leer ist - mit Weg zur naechsten Handlung. */
export function EmptyState({
  icon: Icon,
  titleKey,
  textKey,
  action,
}: {
  icon?: LucideIcon;
  titleKey: TranslationKey;
  textKey?: TranslationKey;
  action?: React.ReactNode;
}) {
  const t = useT();
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center"
    >
      {Icon ? <Icon className="size-8 text-muted-foreground" aria-hidden /> : null}
      <p className="font-medium">{t(titleKey)}</p>
      {textKey ? <p className="max-w-sm text-sm text-muted-foreground">{t(textKey)}</p> : null}
      {action}
    </div>
  );
}
