'use client';

/**
 * QR-Code eines Datensatzes.
 *
 * Der Code zeigt auf die dauerhafte Adresse des Datensatzes; ein gedrucktes
 * Etikett bleibt daher auch nach Umbenennung oder Umzug gueltig.
 */
import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function RecordQr({ path, number, title }: { path: string; number: string; title: string }) {
  const t = useT();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const value = typeof window === 'undefined' ? path : `${window.location.origin}${path}`;

  const canvas = () => wrapperRef.current?.querySelector('canvas') ?? null;

  const download = () => {
    const element = canvas();
    if (!element) return;
    const link = document.createElement('a');
    link.href = element.toDataURL('image/png');
    link.download = `${number}-qr.png`;
    link.click();
  };

  const print = () => {
    const element = canvas();
    if (!element) return;
    const image = element.toDataURL('image/png');
    const printWindow = window.open('', '_blank', 'width=480,height=640');
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>${number}</title><style>
        body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;
        justify-content:center;height:100vh;margin:0}
        img{width:60mm;height:60mm}
        p{margin:4px 0;text-align:center}
       </style></head><body>
        <img src="${image}" alt="" />
        <p><strong>${title}</strong></p>
        <p>${number}</p>
       </body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="flex flex-col items-start gap-4" data-testid="record-qr">
      <div ref={wrapperRef} className="rounded-xl border bg-white p-4">
        <QRCodeCanvas value={value} size={200} level="M" marginSize={2} />
      </div>
      <p className="break-all text-xs text-muted-foreground" data-testid="record-qr-value">
        {value}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={download} data-testid="record-qr-download">
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </Button>
        <Button variant="outline" onClick={print} data-testid="record-qr-print">
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </Button>
      </div>
    </section>
  );
}
