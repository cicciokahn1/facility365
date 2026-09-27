'use client';

/**
 * Berichte.
 *
 * Zeigt ausschliesslich, was aus den erfassten Daten hervorgeht - keine
 * Hochrechnungen und keine Beispielzahlen.
 */
import Link from 'next/link';
import { AlertTriangle, Clock3 } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { ManagementReport } from '@/components/modules/management-report';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCollectionItems } from '@/lib/data/store';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { DAMAGE_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';
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
  const todayValue = today();

  const upcoming = maintenances
    .filter((maintenance) => maintenance.nextDate && !isDone('maintenances', maintenance.status))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
    .slice(0, 8);

  const empty = orders.length + damages.length + maintenances.length + properties.length === 0;
  const openOrders = orders.filter((order) => !isDone('orders', order.status));
  const overdueOrders = openOrders
    .filter((order) => order.dueDate && order.dueDate < todayValue)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueSoonOrders = openOrders
    .filter(
      (order) =>
        order.dueDate &&
        order.dueDate >= todayValue &&
        order.dueDate <= addDays(todayValue, 7),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

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
          <ManagementReport />

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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="size-4" aria-hidden />
                  {t('analytics.deadlineMonitor')}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 sm:max-w-md">
                  <Metric
                    labelKey="analytics.overdueOrders"
                    value={overdueOrders.length}
                    tone={overdueOrders.length > 0 ? 'danger' : undefined}
                  />
                  <Metric labelKey="analytics.dueSoonOrders" value={dueSoonOrders.length} />
                </div>
                {overdueOrders.length + dueSoonOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('analytics.noDeadlineOrders')}</p>
                ) : (
                  <ul className="divide-y">
                    {[...overdueOrders, ...dueSoonOrders].slice(0, 8).map((order) => {
                      const overdue = order.dueDate < todayValue;
                      return (
                        <li key={order.id}>
                          <Link href={`/orders/${order.id}`} className="flex items-center gap-3 py-3">
                            {overdue ? (
                              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
                            ) : (
                              <Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {order.title || order.number}
                            </span>
                            <Badge variant={overdue ? 'destructive' : 'secondary'}>
                              {formatDate(order.dueDate, settings.language)}
                            </Badge>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
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

function Metric({
  labelKey,
  value,
  tone,
}: {
  labelKey: TranslationKey;
  value: number;
  tone?: 'danger';
}) {
  const t = useT();
  return (
    <div>
      <p className="truncate text-xs text-muted-foreground">{t(labelKey)}</p>
      <p className={`text-2xl font-semibold tabular-nums ${tone === 'danger' ? 'text-destructive' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function addDays(value: string, amount: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
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
