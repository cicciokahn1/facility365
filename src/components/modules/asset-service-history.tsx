'use client';

/** Chronologische Wartungs- und Servicehistorie einer Anlage. */
import Link from 'next/link';
import { AlertTriangle, ClipboardList, FileText, Wrench } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { ServiceKind, serviceHistory } from '@/lib/assets/passport';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import {
  DAMAGE_STATUS_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  REPORT_STATUS_OPTIONS,
  SelectOption,
} from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { Asset } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

const ICONS: Record<ServiceKind, typeof Wrench> = {
  maintenance: Wrench,
  order: ClipboardList,
  damage: AlertTriangle,
  report: FileText,
};

const OPTIONS: Record<ServiceKind, SelectOption[]> = {
  maintenance: MAINTENANCE_STATUS_OPTIONS,
  order: ORDER_STATUS_OPTIONS,
  damage: DAMAGE_STATUS_OPTIONS,
  report: REPORT_STATUS_OPTIONS,
};

const LABEL_KEYS = {
  maintenance: 'module.maintenances.singular',
  order: 'module.orders.singular',
  damage: 'module.damages.singular',
  report: 'module.reports.singular',
} as const;

export function AssetServiceHistory({ asset }: { asset: Asset }) {
  const t = useT();
  const { settings } = useSettings();
  const maintenances = useCollectionItems('maintenances').filter((item) => item.assetId === asset.id);
  const orders = useCollectionItems('orders').filter((item) => item.assetId === asset.id);
  const damages = useCollectionItems('damages').filter((item) => item.assetId === asset.id);
  const reportIds = new Set(orders.map((order) => order.id));
  const reports = useCollectionItems('reports').filter((item) => reportIds.has(item.orderId));

  const events = serviceHistory(maintenances, orders, damages, reports);

  if (events.length === 0) return <EmptyState icon={Wrench} titleKey="service.empty" />;

  return (
    <ol className="divide-y rounded-xl border bg-card" data-testid="service-history">
      {events.map((event) => {
        const Icon = ICONS[event.kind];
        return (
          <li key={`${event.kind}-${event.id}`} data-testid="service-event">
            <Link href={event.path} className="flex items-start gap-3 p-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">
                  {formatDate(event.date, settings.language)} · {t(LABEL_KEYS[event.kind])}
                </span>
                <span className="block truncate text-sm font-medium">{event.title}</span>
                {event.party ? (
                  <span className="block truncate text-xs text-muted-foreground">{event.party}</span>
                ) : null}
                {event.documentCount > 0 ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="size-3" aria-hidden />
                    {event.documentCount} · {t('tab.documents')}
                  </span>
                ) : null}
              </span>
              <StatusBadge value={event.status} options={OPTIONS[event.kind]} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
