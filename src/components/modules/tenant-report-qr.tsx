'use client';

/**
 * Mieter-Melde-QR einer Liegenschaft.
 *
 * Der QR fuehrt auf die oeffentliche Schadenmeldung; Bewohner melden damit
 * Schaeden ohne Anmeldung direkt ins Modul. Etikett drucken oder kopieren.
 */
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RecordQr } from '@/components/modules/record-qr';
import { useT } from '@/lib/i18n/provider';
import { Property } from '@/lib/types';

export function TenantReportQr({ property }: { property: Property }) {
  const t = useT();
  const path = `/melden?p=${property.id}`;

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t('tenantReport.hint')}</p>
      <RecordQr
        path={path}
        number={`${property.number}-meldung`}
        title={property.name || property.number}
      />
      <Button
        variant="outline"
        size="sm"
        data-testid="tenant-report-copy"
        onClick={() => {
          const url = `${window.location.origin}${path}`;
          void navigator.clipboard.writeText(url).then(() => toast.success(t('tenantReport.copied')));
        }}
      >
        <Copy className="size-4" aria-hidden />
        {t('tenantReport.copyLink')}
      </Button>
    </div>
  );
}
