'use client';

/**
 * Startseite.
 *
 * Bewusst knapp gehalten: offene Arbeit, naechste Termine, Hinweise und die
 * haeufigsten Schnellaktionen. Keine Kennzahlen zu Umsatz, Stunden oder
 * Rechnungen - die gehoeren in die spaeteren Auswertungen.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ClipboardList,
  ClipboardCheck,
  Clock3,
  FileText,
  Plus,
  ShieldAlert,
  SprayCan,
  UserPlus,
  Wrench,
} from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { WeatherWidget } from '@/components/modules/weather-widget';
import { StatusBadge } from '@/components/common/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BRAND_LOGO_SRC, isBrandLogo } from '@/lib/branding/logo';
import { useAccess } from '@/lib/auth/scope';
import { isReminderDue } from '@/lib/contracts/reminder';
import { documentExpiryState } from '@/lib/documents/expiry';
import { useCollectionItems } from '@/lib/data/store';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { DAMAGE_STATUS_OPTIONS, MAINTENANCE_STATUS_OPTIONS, ORDER_STATUS_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { ModuleKey } from '@/lib/types';
import { formatDate, daysUntil, today } from '@/lib/utils/format';
import { isDone } from '@/lib/workflow/complete';

const QUICK_ACTIONS: {
  href: string;
  module: ModuleKey;
  labelKey: TranslationKey;
  icon: typeof Plus;
  primary?: boolean;
}[] = [
  { href: '/orders?new=1', module: 'orders', labelKey: 'dashboard.quick.order', icon: ClipboardList, primary: true },
  {
    href: '/customers?new=1',
    module: 'customers',
    labelKey: 'dashboard.quick.customer',
    icon: UserPlus,
  },
  {
    href: '/maintenances?new=1',
    module: 'maintenances',
    labelKey: 'dashboard.quick.maintenance',
    icon: Wrench,
    primary: true,
  },
  { href: '/damages?new=1', module: 'damages', labelKey: 'dashboard.quick.damage', icon: ShieldAlert, primary: true },
  { href: '/reports?new=1', module: 'reports', labelKey: 'dashboard.quick.report', icon: FileText, primary: true },
  { href: '/inspections?new=1', module: 'inspections', labelKey: 'dashboard.quick.inspection', icon: ClipboardCheck, primary: true },
  { href: '/cleaning/tasks?new=1', module: 'cleaningtasks', labelKey: 'dashboard.quick.cleaning', icon: SprayCan, primary: true },
  { href: '/reports?new=1&workTime=1', module: 'reports', labelKey: 'dashboard.quick.workTime', icon: Clock3 },
  { href: '/documents?new=1&photo=1', module: 'documents', labelKey: 'dashboard.quick.photo', icon: Camera },
  { href: '/analytics', module: 'analytics', labelKey: 'report.openReport', icon: BarChart3 },
];

function dueUrgency(date: string) {
  const days = daysUntil(date);
  return days !== null && days < 0 ? 0 : 1;
}

export default function DashboardPage() {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const damages = useCollectionItems('damages');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const inspections = useCollectionItems('inspections');
  const documents = useCollectionItems('documents');
  const contracts = useCollectionItems('contracts');

  const openOrders = useMemo(
    () => orders.filter((order) => !isDone('orders', order.status)),
    [orders],
  );
  const openMaintenances = useMemo(
    () => maintenances.filter((maintenance) => !isDone('maintenances', maintenance.status)),
    [maintenances],
  );
  const openDamages = useMemo(
    () => damages.filter((damage) => !isDone('damages', damage.status)),
    [damages],
  );

  const appointments = useMemo(
    () =>
      [
        ...openOrders
          .filter((order) => order.dueDate)
          .map((order) => ({
            id: order.id,
            href: `/orders/${order.id}`,
            title: order.title,
            date: order.dueDate,
            labelKey: 'module.orders.singular' as TranslationKey,
          })),
        ...openMaintenances
          .filter((maintenance) => maintenance.nextDate)
          .map((maintenance) => ({
            id: maintenance.id,
            href: `/maintenances/${maintenance.id}`,
            title: maintenance.title,
            date: maintenance.nextDate,
            labelKey: 'module.maintenances.singular' as TranslationKey,
          })),
        ...legionella
          .filter((check) => check.nextDate)
          .map((check) => ({
            id: check.id,
            href: `/legionella/${check.id}`,
            title: check.title || check.system,
            date: check.nextDate,
            labelKey: 'module.legionella.singular' as TranslationKey,
          })),
        ...rcd
          .filter((check) => check.status !== 'done' && check.nextDate)
          .map((check) => ({
            id: check.id,
            href: `/rcd/${check.id}`,
            title: check.title || check.device,
            date: check.nextDate,
            labelKey: 'module.rcd.singular' as TranslationKey,
          })),
        ...inspections
          .filter((check) => check.status !== 'done' && check.nextDate)
          .map((check) => ({
            id: check.id,
            href: `/inspections/${check.id}`,
            title: check.title || check.customType,
            date: check.nextDate,
            labelKey: 'module.inspections.singular' as TranslationKey,
          })),
      ]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 6),
    [inspections, legionella, openMaintenances, openOrders, rcd],
  );

  const notifications = useMemo(
    () =>
      [
        ...openOrders
          .filter((order) => order.dueDate && order.dueDate < today())
          .map((order) => ({
            id: `order-${order.id}`,
            href: `/orders/${order.id}`,
            textKey: 'dashboard.overdueOrder' as TranslationKey,
            title: order.title,
            urgency: 0,
          })),
        ...openMaintenances
          .filter((maintenance) => {
            const days = daysUntil(maintenance.nextDate);
            return days !== null && days <= 14;
          })
          .map((maintenance) => ({
            id: `maintenance-${maintenance.id}`,
            href: `/maintenances/${maintenance.id}`,
            textKey: 'dashboard.dueMaintenance' as TranslationKey,
            title: maintenance.title,
            urgency: dueUrgency(maintenance.nextDate),
          })),
        ...openDamages
          .filter((damage) => damage.priority === 'critical' || damage.priority === 'high')
          .map((damage) => ({
            id: `damage-${damage.id}`,
            href: `/damages/${damage.id}`,
            textKey: 'dashboard.urgentDamage' as TranslationKey,
            title: damage.title,
            urgency: damage.priority === 'critical' ? 0 : 1,
          })),
        ...legionella
          .filter((check) => {
            const days = daysUntil(check.nextDate);
            return days !== null && days <= 14;
          })
          .map((check) => ({
            id: `legionella-${check.id}`,
            href: `/legionella/${check.id}`,
            textKey: 'dashboard.dueLegionella' as TranslationKey,
            title: check.title || check.system,
            urgency: dueUrgency(check.nextDate),
          })),
        ...rcd
          .filter((check) => {
            if (check.status === 'done') return false;
            const days = daysUntil(check.nextDate);
            return days !== null && days <= 14;
          })
          .map((check) => ({
            id: `rcd-${check.id}`,
            href: `/rcd/${check.id}`,
            textKey: 'dashboard.dueRcd' as TranslationKey,
            title: check.title || check.device,
            urgency: dueUrgency(check.nextDate),
          })),
        ...inspections
          .filter((check) => {
            if (check.status === 'done') return false;
            const days = daysUntil(check.nextDate);
            return days !== null && days <= 14;
          })
          .map((check) => ({
            id: `inspection-${check.id}`,
            href: `/inspections/${check.id}`,
            textKey: 'dashboard.dueInspection' as TranslationKey,
            title: check.title || check.customType,
            urgency: dueUrgency(check.nextDate),
          })),
        ...documents
          .filter((document) => documentExpiryState(document.validUntil, today()) !== 'valid')
          .map((document) => ({
            id: `document-${document.id}`,
            href: `/documents/${document.id}`,
            textKey: 'dashboard.documentExpiring' as TranslationKey,
            title: document.title || document.number,
            urgency: documentExpiryState(document.validUntil, today()) === 'expired' ? 0 : 1,
          })),
        ...contracts
          .filter((contract) => isReminderDue(contract, today()))
          .map((contract) => ({
            id: `contract-${contract.id}`,
            href: `/contracts/${contract.id}`,
            textKey: 'dashboard.expiringContract' as TranslationKey,
            title: contract.title || contract.partner,
            urgency: 1,
          })),
      ]
        .sort((a, b) => a.urgency - b.urgency)
        .slice(0, 8),
    [contracts, documents, inspections, legionella, openDamages, openMaintenances, openOrders, rcd],
  );

  const criticalOrders = useMemo(
    () => openOrders.filter((order) => order.priority === 'critical').length,
    [openOrders],
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t('module.dashboard')}</h1>
          <p className="text-sm text-muted-foreground">
            {settings.profileName ? `${t('dashboard.greeting.day')}, ${settings.profileName}` : t('app.tagline')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <WeatherWidget />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- Data-URL aus den Einstellungen */}
          <img
            src={isBrandLogo(settings.companyLogo) ? BRAND_LOGO_SRC : settings.companyLogo}
            alt={settings.companyName || 'Facility365'}
            data-testid="dashboard-logo"
            className="h-11 w-auto max-w-[150px] shrink-0 rounded object-contain dark:bg-white/95 dark:p-1 sm:h-14 sm:max-w-[200px]"
          />
        </div>
      </header>

      <div className="sm:hidden">
        <WeatherWidget />
      </div>

      <Link
        href="/today"
        className="flex min-h-20 items-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 transition-colors hover:border-primary/60 hover:bg-primary/10"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">{t('dashboard.today')}</span>
          <span className="block text-sm text-muted-foreground">{t('today.hint')}</span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />
      </Link>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          href="/orders"
          labelKey="dashboard.openOrders"
          value={openOrders.length}
          icon={ClipboardList}
        />
        <StatCard
          href="/maintenances"
          labelKey="dashboard.dueMaintenances"
          value={openMaintenances.length}
          icon={Wrench}
        />
        <StatCard
          href="/damages"
          labelKey="dashboard.openDamages"
          value={openDamages.length}
          icon={ShieldAlert}
        />
        <StatCard
          href="/orders"
          labelKey="dashboard.criticalOrders"
          value={criticalOrders}
          icon={AlertTriangle}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.quickActions')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.filter((action) => action.primary && access.canRead(action.module)).map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  data-testid="quick-action"
                  className="flex h-28 touch-manipulation flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center text-base font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <Icon className="size-6 text-primary" aria-hidden />
                  <span className="line-clamp-2">{t(action.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer list-none rounded-lg border px-4 py-3 text-center text-sm font-medium text-muted-foreground">
            Weitere Aktionen
          </summary>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACTIONS.filter((action) => !action.primary && access.canRead(action.module)).map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    data-testid="secondary-quick-action"
                    className="flex h-24 touch-manipulation flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <Icon className="size-5 text-primary" aria-hidden />
                    <span className="line-clamp-2">{t(action.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" aria-hidden />
              {t('dashboard.calendar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <EmptyState titleKey="dashboard.calendarEmpty" />
            ) : (
              <ul className="divide-y" data-testid="calendar-list">
                {appointments.map((appointment) => (
                  <li key={`${appointment.labelKey}-${appointment.id}`}>
                    <Link href={appointment.href} className="flex items-center gap-3 py-3">
                      <span className="flex w-20 shrink-0 flex-col text-xs text-muted-foreground">
                        {formatDate(appointment.date, settings.language)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {appointment.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t(appointment.labelKey)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" aria-hidden />
              {t('dashboard.notifications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <EmptyState titleKey="dashboard.notificationsEmpty" />
            ) : (
              <ul className="divide-y" data-testid="notification-list">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <Link href={notification.href} className="flex min-h-16 flex-col justify-center gap-0.5 py-3">
                      <span className="text-sm font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">{t(notification.textKey)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden gap-4 sm:grid xl:grid-cols-3">
        <RecentCard
          titleKey="dashboard.openOrders"
          href="/orders"
          items={openOrders.slice(0, 5).map((order) => ({
            id: order.id,
            href: `/orders/${order.id}`,
            title: order.title,
            status: order.status,
          }))}
          options={ORDER_STATUS_OPTIONS}
        />
        <RecentCard
          titleKey="dashboard.dueMaintenances"
          href="/maintenances"
          items={openMaintenances.slice(0, 5).map((maintenance) => ({
            id: maintenance.id,
            href: `/maintenances/${maintenance.id}`,
            title: maintenance.title,
            status: maintenance.status,
          }))}
          options={MAINTENANCE_STATUS_OPTIONS}
        />
        <RecentCard
          titleKey="dashboard.openDamages"
          href="/damages"
          items={openDamages.slice(0, 5).map((damage) => ({
            id: damage.id,
            href: `/damages/${damage.id}`,
            title: damage.title,
            status: damage.status,
          }))}
          options={DAMAGE_STATUS_OPTIONS}
        />
      </div>
    </div>
  );
}

function StatCard({
  href,
  labelKey,
  value,
  icon: Icon,
}: {
  href: string;
  labelKey: TranslationKey;
  value: number;
  icon: typeof Plus;
}) {
  const t = useT();
  return (
    <Link
      href={href}
      data-testid="stat-card"
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <span className="truncate">{t(labelKey)}</span>
      </span>
      <span className="text-3xl font-semibold tabular-nums">{value}</span>
    </Link>
  );
}

function RecentCard({
  titleKey,
  href,
  items,
  options,
}: {
  titleKey: TranslationKey;
  href: string;
  items: { id: string; href: string; title: string; status: string }[];
  options: typeof ORDER_STATUS_OPTIONS;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">{t(titleKey)}</CardTitle>
        <Link href={href} className="text-sm text-primary">
          {t('action.showAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState titleKey="list.empty" />
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                  <StatusBadge value={item.status} options={options} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
