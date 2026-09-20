'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  ClipboardCheck,
  FileText,
  History,
  Plus,
  ShieldAlert,
  SprayCan,
  Wrench,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccess } from '@/lib/auth/scope';
import { useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { isDone } from '@/lib/workflow/complete';
import { formatDate, formatMoney } from '@/lib/utils/format';
import type { BaseEntity, CollectionKey } from '@/lib/types';
import { useDossier } from '@/lib/links/dossier';

type ObjectCollection = 'properties' | 'buildings' | 'rooms' | 'assets';

const ACTIONS: Record<ObjectCollection, {
  href: string;
  module: CollectionKey;
  labelKey: TranslationKey;
  icon: typeof Plus;
}[]> = {
  properties: [
    { href: '/damages?new=1', module: 'damages', labelKey: 'dashboard.quick.damage', icon: ShieldAlert },
    { href: '/orders?new=1', module: 'orders', labelKey: 'dashboard.quick.order', icon: FileText },
    { href: '/documents?new=1&photo=1', module: 'documents', labelKey: 'dashboard.quick.photo', icon: Camera },
  ],
  buildings: [
    { href: '/damages?new=1', module: 'damages', labelKey: 'dashboard.quick.damage', icon: ShieldAlert },
    { href: '/orders?new=1', module: 'orders', labelKey: 'dashboard.quick.order', icon: FileText },
    { href: '/maintenances?new=1', module: 'maintenances', labelKey: 'dashboard.quick.maintenance', icon: Wrench },
    { href: '/documents?new=1&photo=1', module: 'documents', labelKey: 'dashboard.quick.photo', icon: Camera },
  ],
  rooms: [
    { href: '/damages?new=1', module: 'damages', labelKey: 'dashboard.quick.damage', icon: ShieldAlert },
    { href: '/cleaning/tasks?new=1', module: 'cleaningtasks', labelKey: 'dashboard.quick.cleaning', icon: SprayCan },
    { href: '/orders?new=1', module: 'orders', labelKey: 'dashboard.quick.order', icon: FileText },
    { href: '/documents?new=1&photo=1', module: 'documents', labelKey: 'dashboard.quick.photo', icon: Camera },
  ],
  assets: [
    { href: '/maintenances?new=1', module: 'maintenances', labelKey: 'dashboard.quick.maintenance', icon: Wrench },
    { href: '/inspections?new=1', module: 'inspections', labelKey: 'dashboard.quick.inspection', icon: ClipboardCheck },
    { href: '/damages?new=1', module: 'damages', labelKey: 'dashboard.quick.damage', icon: ShieldAlert },
    { href: '/orders?new=1', module: 'orders', labelKey: 'dashboard.quick.order', icon: FileText },
    { href: '/documents?new=1&photo=1', module: 'documents', labelKey: 'dashboard.quick.photo', icon: Camera },
  ],
};

function related(items: BaseEntity[], field: string, ids: Set<string>) {
  return items.filter((item) => ids.has(stringField(item, field)));
}

export function SmartObjectView({
  collection,
  entity,
}: {
  collection: ObjectCollection;
  entity: BaseEntity;
}) {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const damages = useCollectionItems('damages');
  const inspections = useCollectionItems('inspections');
  const cleaningTasks = useCollectionItems('cleaningtasks');
  const appointments = useCollectionItems('appointments');
  const dossier = useDossier(collection, entity.id);

  const buildingIds = new Set(
    collection === 'buildings'
      ? [entity.id]
      : collection === 'properties'
        ? buildings.filter((item) => item.propertyId === entity.id).map((item) => item.id)
        : [],
  );
  const roomIds = new Set(
    collection === 'rooms'
      ? [entity.id]
      : collection === 'buildings'
        ? rooms.filter((item) => item.buildingId === entity.id).map((item) => item.id)
        : collection === 'properties'
          ? rooms.filter((item) => buildingIds.has(item.buildingId)).map((item) => item.id)
          : [],
  );
  const assetIds = new Set(
    collection === 'assets'
      ? [entity.id]
      : assets
          .filter((item) =>
            collection === 'properties'
              ? item.propertyId === entity.id
              : collection === 'buildings'
                ? item.buildingId === entity.id
                : collection === 'rooms'
                  ? item.roomId === entity.id
                  : false,
          )
          .map((item) => item.id),
  );

  const matches = (item: BaseEntity) => {
    if (collection === 'assets') return stringField(item, 'assetId') === entity.id;
    return (
      [stringField(item, 'propertyId')].includes(entity.id) ||
      buildingIds.has(stringField(item, 'buildingId')) ||
      roomIds.has(stringField(item, 'roomId')) ||
      assetIds.has(stringField(item, 'assetId'))
    );
  };

  const scoped = <T extends BaseEntity>(name: CollectionKey, items: T[]) =>
    items.filter((item) => access.canRead(name) && access.visible(name, item));
  const objectOrders = scoped('orders', orders).filter(matches);
  const objectMaintenances = scoped('maintenances', maintenances).filter(matches);
  const objectDamages = scoped('damages', damages).filter(matches);
  const objectInspections = scoped('inspections', inspections).filter(matches);
  const objectCleaning = scoped('cleaningtasks', cleaningTasks).filter(matches);
  const objectAppointments = scoped('appointments', appointments).filter(matches);
  const dueOf = (item: BaseEntity) =>
    stringField(item, 'dueDate') ||
    stringField(item, 'nextDate') ||
    stringField(item, 'date');
  const today = new Date().toISOString().slice(0, 10);
  const open = [
    ...objectOrders.filter((item) => !isDone('orders', item.status)),
    ...objectMaintenances.filter((item) => !isDone('maintenances', item.status)),
    ...objectDamages.filter((item) => !isDone('damages', item.status)),
    ...objectInspections.filter((item) => !isDone('inspections', item.status)),
    ...objectCleaning.filter((item) => !isDone('cleaningtasks', item.status)),
  ];
  const overdue = open.filter((item) => {
    const due = dueOf(item);
    return Boolean(due) && due < today;
  });
  const upcomingMaintenances = objectMaintenances
    .filter((item) => !isDone('maintenances', item.status) && dueOf(item) >= today)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)))
    .slice(0, 5);
  const upcomingInspections = objectInspections
    .filter((item) => !isDone('inspections', item.status) && dueOf(item) >= today)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)))
    .slice(0, 5);
  const upcomingAppointments = objectAppointments
    .filter((item) => item.status === 'planned' && dueOf(item) >= today)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)))
    .slice(0, 5);
  const latest = dossier.entries
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const actions = ACTIONS[collection].filter((action) => access.canWrite(action.module));
  const area = stringField(entity, 'area');
  const condition = stringField(entity, 'conditionStatus');

  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-primary/15 bg-primary/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('smart.objectView')}</h2>
          <p className="text-sm text-muted-foreground">{t('smart.objectHint')}</p>
        </div>
        <span className="text-sm text-muted-foreground">{entity.number}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <InfoCard
          label={t('smart.openItems')}
          value={String(open.length)}
          tone={overdue.length > 0 ? 'warning' : undefined}
        />
        <InfoCard
          label={t('smart.overdue')}
          value={String(overdue.length)}
          tone={overdue.length > 0 ? 'danger' : undefined}
        />
        {area ? <InfoCard label={t('smart.area')} value={`${area} m²`} /> : null}
        {condition ? <InfoCard label={t('smart.condition')} value={condition} /> : null}
        <InfoCard label={t('smart.documents')} value={String(entity.documents.length)} />
        <InfoCard label={t('smart.photos')} value={String(entity.photos.length)} />
        <InfoCard label={t('smart.costs')} value={formatMoney(dossier.cost, settings.currency)} />
      </div>

      {actions.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('smart.directActions')}
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={`${action.module}-${action.href}`}
                  href={`${action.href}&${PARENT_FIELDS[collection]}=${entity.id}`}
                  className="flex min-h-20 touch-manipulation flex-col items-center justify-center gap-1 rounded-lg border bg-card p-2 text-center text-sm font-medium hover:border-primary/50"
                >
                  <Icon className="size-5 text-primary" aria-hidden />
                  <span>{t(action.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('smart.openItems')}</CardTitle></CardHeader>
          <CardContent>
            {open.length === 0 ? <p className="text-sm text-muted-foreground">{t('smart.noOpenItems')}</p> : (
              <ul className="divide-y">
                {open.slice(0, 5).map((item) => {
                  const moduleKey = objectOrders.some((entry) => entry.id === item.id)
                    ? 'orders'
                    : objectMaintenances.some((entry) => entry.id === item.id)
                      ? 'maintenances'
                      : objectDamages.some((entry) => entry.id === item.id)
                        ? 'damages'
                        : objectInspections.some((entry) => entry.id === item.id)
                          ? 'inspections'
                          : 'cleaningtasks';
                  const path = moduleKey === 'cleaningtasks' ? '/cleaning/tasks' : `/${moduleKey}`;
                  return (
                    <li key={`${moduleKey}-${item.id}`}>
                      <Link className="flex items-center justify-between gap-2 py-2 text-sm font-medium hover:text-primary" href={`${path}/${item.id}`}>
                        <span className="truncate">{item.title}</span>
                        {overdue.some((entry) => entry.id === item.id) ? (
                          <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label={t('smart.overdue')} />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><History className="size-4" aria-hidden />{t('smart.lastWork')}</CardTitle></CardHeader>
          <CardContent>
            {latest.length === 0 ? <p className="text-sm text-muted-foreground">{t('smart.noHistory')}</p> : (
              <ul className="divide-y">
                {latest.map((item) => (
                  <li key={item.key}>
                    <Link href={item.path} className="block py-2 text-sm font-medium hover:text-primary">
                      {item.title}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {formatDate(item.date, settings.language)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <OverviewList
          title={t('smart.upcomingMaintenance')}
          icon={Wrench}
          empty={t('smart.noUpcoming')}
          items={upcomingMaintenances}
          path="/maintenances"
          dateOf={dueOf}
          language={settings.language}
        />
        <OverviewList
          title={t('smart.upcomingInspections')}
          icon={ClipboardCheck}
          empty={t('smart.noUpcoming')}
          items={upcomingInspections}
          path="/inspections"
          dateOf={dueOf}
          language={settings.language}
        />
        <OverviewList
          title={t('smart.nextAppointments')}
          icon={CalendarClock}
          empty={t('smart.noUpcoming')}
          items={upcomingAppointments}
          path="/appointments"
          dateOf={dueOf}
          language={settings.language}
        />
        <OverviewList
          title={t('module.damages')}
          icon={ShieldAlert}
          empty={t('smart.noOpenItems')}
          items={objectDamages}
          path="/damages"
          dateOf={(item) => stringField(item, 'reportedAt') || item.createdAt}
          language={settings.language}
        />
      </div>
    </section>
  );
}

const PARENT_FIELDS: Record<ObjectCollection, string> = {
  properties: 'propertyId',
  buildings: 'buildingId',
  rooms: 'roomId',
  assets: 'assetId',
};

function InfoCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'warning' | 'danger';
}) {
  return (
    <div className={`rounded-lg border bg-card px-3 py-2 ${tone === 'danger' ? 'border-destructive/50 bg-destructive/5' : tone === 'warning' ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-lg font-semibold">{value}</p>
    </div>
  );
}

function OverviewList({
  title,
  icon: Icon,
  empty,
  items,
  path,
  dateOf,
  language,
}: {
  title: string;
  icon: typeof Wrench;
  empty: string;
  items: BaseEntity[];
  path: string;
  dateOf: (item: BaseEntity) => string;
  language: 'de' | 'fr' | 'it' | 'en';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" aria-hidden />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={`${path}/${item.id}`} className="flex items-center justify-between gap-2 py-2 text-sm font-medium hover:text-primary">
                  <span className="truncate">{stringField(item, 'title') || item.number}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {formatDate(dateOf(item), language)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
