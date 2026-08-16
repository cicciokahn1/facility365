'use client';

/**
 * QR-Code einer Anlage: anzeigen, herunterladen, drucken, scannen.
 *
 * Der Code verweist ausschliesslich auf die dauerhafte Anlagen-ID. Aendern sich
 * spaeter Name, Gebaeude, Raum oder Hersteller, bleibt das gedruckte Etikett
 * unveraendert gueltig.
 */
import { useRef, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Download, Printer, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAssetCards } from '@/lib/assets/use-asset-cards';
import { assetCodeUrl } from '@/lib/assets/passport';
import { useT } from '@/lib/i18n/provider';
import { Asset } from '@/lib/types';

/** Beibehalten fuer bestehende Aufrufer; die Adresse traegt die Anlagen-ID. */
export const assetUrl = assetCodeUrl;

export function QrPanel({ asset }: { asset: Asset }) {
  const t = useT();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { downloadCards, printCards } = useAssetCards();
  const [busy, setBusy] = useState(false);
  const value = assetCodeUrl(asset.number);

  const canvas = () => wrapperRef.current?.querySelector('canvas') ?? null;

  const download = () => {
    const element = canvas();
    if (!element) return;
    const link = document.createElement('a');
    link.href = element.toDataURL('image/png');
    link.download = `${asset.number}-qr.png`;
    link.click();
  };

  const run = async (action: (assets: Asset[]) => Promise<void>) => {
    setBusy(true);
    try {
      await action([asset]);
      toast.success(t('asset.cardCreated'));
    } finally {
      setBusy(false);
    }
  };

  const print = () => {
    const element = canvas();
    if (!element) return;
    const image = element.toDataURL('image/png');
    const printWindow = window.open('', '_blank', 'width=480,height=640');
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>${asset.number}</title><style>
        body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;
        justify-content:center;height:100vh;margin:0}
        img{width:60mm;height:60mm}
        p{margin:4px 0;text-align:center}
       </style></head><body>
        <img src="${image}" alt="" />
        <p><strong>${asset.name}</strong></p>
        <p>${asset.number}</p>
       </body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="flex flex-col items-start gap-4" data-testid="qr-panel">
      <div ref={wrapperRef} className="rounded-xl border bg-white p-4">
        <QRCodeCanvas value={value} size={200} level="M" marginSize={2} />
      </div>
      <p className="break-all text-xs text-muted-foreground" data-testid="qr-value">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{t('asset.qrHint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={download} data-testid="qr-download">
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </Button>
        <Button variant="outline" onClick={print} data-testid="qr-print">
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/assets?scan=1" data-testid="qr-scan-link">
            <QrCode className="size-4" aria-hidden />
            {t('action.scan')}
          </Link>
        </Button>
      </div>

      <div className="w-full rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="size-4" aria-hidden />
          {t('asset.card')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{t('asset.cardHint')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run(downloadCards)} data-testid="card-download">
            <Download className="size-4" aria-hidden />
            {t('action.download')}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void run(printCards)}
            data-testid="card-print"
          >
            <Printer className="size-4" aria-hidden />
            {t('action.print')}
          </Button>
        </div>
      </div>
    </section>
  );
}
