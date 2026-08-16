'use client';

/** Rechnungs-PDF herunterladen und drucken. */
import { Download, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { useInvoicePdf } from '@/lib/invoices/use-invoice-pdf';
import { Invoice } from '@/lib/types';

export function InvoicePdfPanel({ invoice }: { invoice: Invoice }) {
  const t = useT();
  const pdf = useInvoicePdf();
  const hasZeroPrice = invoice.items.some((item) => item.unitPrice === 0);

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4" data-testid="invoice-pdf">
      <div>
        <h2 className="text-base font-semibold">{t('invoice.pdfTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('invoice.pdfHint')}</p>
        {hasZeroPrice ? (
          <p className="mt-2 text-sm text-muted-foreground" data-testid="invoice-zero-price">
            {t('invoice.zeroPrice')}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          className="h-12"
          onClick={() => pdf.download(invoice)}
          data-testid="invoice-pdf-download"
        >
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() => pdf.print(invoice)}
          data-testid="invoice-pdf-print"
        >
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </Button>
      </div>
    </section>
  );
}
