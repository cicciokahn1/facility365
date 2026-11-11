'use client';

/**
 * Melde-QR aller Liegenschaften auf einer Seite: Bewohner scannen,
 * Schaden landet direkt in der App. Drucken mit dem System-Dialog.
 */
import { Printer } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { TenantReportQr } from '@/components/modules/tenant-report-qr';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';

export default function MeldeQrPage() {
  const t = useT();
  const properties = useCollectionItems('properties');

  if (properties.length === 0) {
    return <EmptyState titleKey="list.empty" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t('tab.tenantReport')}</h1>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {properties.map((property) => (
          <TenantReportQr key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
