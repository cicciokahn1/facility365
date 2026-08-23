'use client';

/**
 * Aktivitaets- und Aenderungshistorie.
 *
 * Die Liste ist bewusst nur lesbar: Eintraege entstehen ausschliesslich beim
 * Anlegen, Aendern und Loeschen von Daten und werden nie ueberschrieben.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { useAccess } from '@/lib/auth/scope';
import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { moduleByCollection } from '@/lib/modules';
import { useSettings } from '@/lib/settings/provider';
import { formatDateTime } from '@/lib/utils/format';

export function ActivityLog() {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const activities = useCollectionItems('activities');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities
      .filter((activity) => access.visible('activities', activity))
      .filter((activity) =>
        needle
          ? [activity.entityTitle, activity.entityNumber, activity.userName]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 500);
  }, [access, activities, query]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('activity.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('activity.hint')}</p>
      </header>

      <Input
        data-testid="activity-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('list.searchPlaceholder')}
        className="h-11"
      />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('activity.empty')}</p>
      ) : (
        <ul data-testid="activity-list" className="flex flex-col gap-2">
          {rows.map((activity) => {
            const moduleDef = moduleByCollection(activity.module);
            return (
              <li key={activity.id}>
                <Link
                  href={`${moduleDef.path}/${activity.entityId}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {activity.entityTitle || activity.entityNumber}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t(moduleDef.singularKey)} · {t(activity.action as TranslationKey)} ·{' '}
                      {activity.userName || t('activity.user')}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(activity.at, settings.language)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
