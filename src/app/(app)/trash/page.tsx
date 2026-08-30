'use client';

/**
 * Papierkorb.
 *
 * Geloeschte Datensaetze bleiben erhalten und werden hier gesammelt. Wer
 * loeschen darf, darf wiederherstellen; endgueltig entfernen kann nur, wer im
 * Modul das Loeschrecht hat.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAccess } from '@/lib/auth/scope';
import { COLLECTIONS } from '@/lib/data/collections';
import { useTrash } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { moduleByCollection } from '@/lib/modules';
import { useSettings } from '@/lib/settings/provider';
import { titleOfEntity } from '@/lib/module-config';
import { BaseEntity, CollectionKey } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/format';

interface Entry {
  collection: CollectionKey;
  entity: BaseEntity;
}

export default function TrashPage() {
  const t = useT();
  const trash = useTrash();
  const access = useAccess();
  const { settings } = useSettings();
  const [pending, setPending] = useState<Entry | null>(null);

  const entries = useMemo(() => {
    const list: Entry[] = [];
    for (const collection of COLLECTIONS) {
      if (!access.canRead(collection)) continue;
      for (const entity of trash.items[collection]) list.push({ collection, entity });
    }
    return list.sort((a, b) => (b.entity.deletedAt ?? '').localeCompare(a.entity.deletedAt ?? ''));
  }, [access, trash.items]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('trash.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('trash.intro')}</p>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="trash-empty">
              {t('trash.empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.map(({ collection, entity }) => (
                <li
                  key={`${collection}-${entity.id}`}
                  data-testid={`trash-${entity.id}`}
                  className="flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {titleOfEntity(collection, entity) || entity.number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t(moduleByCollection(collection).singularKey)} · {entity.number} ·{' '}
                      {t('trash.deletedAt')}{' '}
                      {entity.deletedAt ? formatDateTime(entity.deletedAt, settings.language) : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {access.canWrite(collection) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`trash-restore-${entity.id}`}
                        onClick={() => {
                          trash.restore(collection, entity.id);
                          toast.success(t('trash.restored'));
                        }}
                      >
                        {t('trash.restore')}
                      </Button>
                    ) : null}
                    {access.canDelete(collection) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`trash-purge-${entity.id}`}
                        onClick={() => setPending({ collection, entity })}
                      >
                        {t('trash.purge')}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={pending !== null} onOpenChange={(open) => (open ? null : setPending(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('trash.purge')}</AlertDialogTitle>
            <AlertDialogDescription>{t('trash.purgeConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="trash-purge-confirm"
              onClick={() => {
                if (pending) trash.purge(pending.collection, pending.entity.id);
                setPending(null);
                toast.success(t('toast.deleted'));
              }}
            >
              {t('action.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
