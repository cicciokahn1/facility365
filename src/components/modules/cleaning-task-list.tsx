'use client';

/**
 * Liste der Reinigungsaufgaben.
 *
 * Ist in den Einstellungen eine eigene Reinigungskraft hinterlegt und die
 * eingeschraenkte Sicht eingeschaltet, zeigt die Liste nur deren Aufgaben.
 */
import { useMemo } from 'react';

import { ListRestriction, ModuleList } from '@/components/module/module-list';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';

/** Einschraenkung auf die eigenen Aufgaben; ohne Zuordnung bleibt alles sichtbar. */
export const useOwnTaskRestriction = (): ListRestriction | undefined => {
  const { settings } = useSettings();
  const cleanerId = settings.cleaningCleanerId;
  const ownOnly = settings.cleaningOwnTasksOnly;
  return useMemo(
    () => (ownOnly && cleanerId ? { field: 'cleanerId', value: cleanerId } : undefined),
    [cleanerId, ownOnly],
  );
};

export function CleaningTaskList() {
  const t = useT();
  const only = useOwnTaskRestriction();

  return (
    <div className="flex flex-col gap-3">
      {only ? (
        <p
          className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          data-testid="cleaning-own-hint"
        >
          {t('cleaning.ownTasksHint')}
        </p>
      ) : null}
      <ModuleList collection="cleaningtasks" only={only} />
    </div>
  );
}
