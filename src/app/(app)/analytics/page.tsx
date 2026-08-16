'use client';

/**
 * Berichte.
 *
 * Zeigt ausschliesslich, was aus den erfassten Daten hervorgeht - keine
 * Hochrechnungen und keine Beispielzahlen.
 */
import Link from 'next/link';

import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { DAMAGE_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { formatDate } from '@/lib/utils/format';
import { isDone } from '@/lib/workflow/complete';

export default function AnalyticsPage() {
  const t = useT();
  const { settings } = useSettings();
  const orders = useCollectionItems('orders');
  const damages = useCollectionItems('damages');
  const maintenances = useCollectionItems('maintenances');
  const customers = useCollectionItems('customers');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');

  const upcoming = maintenances
    .filter((maintenance) => maintenance.nextDate && !isDone('maintenances', maintenance.status))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 8);

  const empty = orders.length + damages.length + maintenances.length + properties.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('analytics.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
      </header>

      {empty ? (
        <EmptyState titleKey="analytics.empty" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.portfolio')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Metric labelKey="module.customers" value={customers.length} />
              <Metric labelKey="module.properties" value={properties.length} />
              <Metric labelKey="module.buildings" value={buildings.length} />
              <Metric labelKey="module.rooms" value={rooms.length} />
              <Metric labelKey="module.assets" value={assets.length} />
              <Metric labelKey="module.orders" value={orders.length} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Distribution
              titleKey="analytics.ordersByStatus"
              options={ORDER_STATUS_OPTIONS}
              values={orders.map((order) => order.status)}
            />
            <Distribution
              titleKey="analytics.damagesByPriority"
              options={PRIORITY_OPTIONS}
              values={damages.map((damage) => damage.priority)}
            />
            <Distribution
              titleKey="module.damages"
              options={DAMAGE_STATUS_OPTIONS}
              values={damages.map((damage) => damage.status)}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('analytics.upcoming')}</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <EmptyState titleKey="list.empty" />
                ) : (
                  <ul className="divide-y">
                    {upcoming.map((maintenance) => (
                      <li key={maintenance.id}>
                        <Link
                          href={`/maintenances/${maintenance.id}`}
                          className="flex items-center gap-3 py-3"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {maintenance.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(maintenance.nextDate, settings.language)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ labelKey, value }: { labelKey: TranslationKey; value: number }) {
  const t = useT();
  return (
    <div>
      <p className="truncate text-xs text-muted-foreground">{t(labelKey)}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Distribution({
  titleKey,
  options,
  values,
}: {
  titleKey: TranslationKey;
  options: typeof ORDER_STATUS_OPTIONS;
  values: string[];
}) {
  const t = useT();
  const total = values.length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t(titleKey)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {total === 0 ? (
          <EmptyState titleKey="list.empty" />
        ) : (
          options.map((option) => {
            const count = values.filter((value) => value === option.value).length;
            return (
              <div key={option.value} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm">{t(option.labelKey)}</span>
                <Progress value={(count / total) * 100} className="h-2" />
                <span className="w-8 shrink-0 text-right text-sm tabular-nums">{count}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
