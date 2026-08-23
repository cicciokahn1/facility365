'use client';

/**
 * Benutzerdetail.
 *
 * Neben den Stammdaten stehen hier die zugewiesenen Standorte, das Aktivieren
 * und Deaktivieren sowie die Daten, die an der Person haengen. Geloescht wird
 * nur, wer nirgends vorkommt - sonst gingen Auftraege, Rapporte und Historien
 * ihren Bezug verlieren.
 */
import { useMemo } from 'react';

import { EntityDetail } from '@/components/module/entity-detail';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useUserReferences } from '@/lib/users/references';
import { AppUser } from '@/lib/types';

export function UserDetail({ id }: { id: string }) {
  const t = useT();
  const sites = useCollectionItems('sites');
  const references = useUserReferences(id);

  const siteOptions = useMemo(
    () => sites.map((site) => ({ id: site.id, name: site.name || site.number })),
    [sites],
  );

  return (
    <EntityDetail
      collection="users"
      id={id}
      deleteBlocked={references.length > 0}
      deleteBlockedKey="user.protected"
      headerExtra={(user, update) => (
        <StatusAction user={user} update={update} />
      )}
      extraTabs={(user, update) => [
        {
          value: 'sites',
          labelKey: 'user.sites',
          content: (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{t('user.sitesHint')}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {siteOptions.map((site) => {
                  const checked = user.siteIds.includes(site.id);
                  return (
                    <li key={site.id}>
                      <label className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
                        <Checkbox
                          checked={checked}
                          data-testid={`user-site-${site.id}`}
                          onCheckedChange={(value) =>
                            update({
                              siteIds: value
                                ? [...user.siteIds, site.id]
                                : user.siteIds.filter((entry) => entry !== site.id),
                            })
                          }
                        />
                        <span className="truncate">{site.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground">{t('user.entraHint')}</p>
            </div>
          ),
        },
        {
          value: 'data',
          labelKey: 'user.assignedData',
          content:
            references.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('list.empty')}</p>
            ) : (
              <ul data-testid="user-references" className="flex flex-col gap-2">
                {references.map((reference) => (
                  <li
                    key={`${reference.collection}-${reference.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 text-sm"
                  >
                    <span className="truncate">{reference.title}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {reference.number}
                    </span>
                  </li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}

function StatusAction({
  user,
  update,
}: {
  user: AppUser;
  update: (values: Partial<AppUser>, action?: string) => void;
}) {
  const t = useT();
  const active = user.status === 'active';
  return (
    <span className="flex items-center gap-2">
      {active ? null : (
        <Badge variant="outline" className="text-destructive" data-testid="user-inactive">
          {t('user.deactivated')}
        </Badge>
      )}
      <Button
        size="sm"
        variant="outline"
        data-testid="toggle-user-status"
        onClick={() => update({ status: active ? 'inactive' : 'active' }, 'history.statusChanged')}
      >
        {active ? t('user.deactivate') : t('user.activate')}
      </Button>
    </span>
  );
}
