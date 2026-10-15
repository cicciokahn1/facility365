'use client';

/**
 * Rundgang-QR einer Liegenschaft.
 *
 * Scannen oeffnet den technischen Rundgang mit dieser Liegenschaft
 * vorausgewaehlt - der QR wird an der Liegenschaft aufgehaengt.
 */
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RecordQr } from '@/components/modules/record-qr';
import { useT } from '@/lib/i18n/provider';
import { Property } from '@/lib/types';

export function WalkthroughQr({ property }: { property: Property }) {
  const t = useT();
  const path = `/walkthrough?p=${property.id}`;

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t('qr.walkthroughHint')}</p>
      <RecordQr
        path={path}
        number={`${property.number}-rundgang`}
        title={property.name || property.number}
      />
      <Button
        variant="outline"
        size="sm"
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
