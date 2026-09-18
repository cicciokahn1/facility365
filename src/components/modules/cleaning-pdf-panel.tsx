'use client';

/** Reinigungsrapport als PDF herunterladen oder drucken. */
import { Download, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCleaningPdf } from '@/lib/cleaning/use-cleaning-pdf';
import { useT } from '@/lib/i18n/provider';
import { CleaningTask } from '@/lib/types';

export function CleaningPdfPanel({ task }: { task: CleaningTask }) {
  const t = useT();
  const pdf = useCleaningPdf();

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4" data-testid="cleaning-pdf">
      <div>
        <h2 className="text-base font-semibold">{t('cleaning.report')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('cleaning.reportHint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="h-12"
          onClick={() => void pdf.download(task, 'a4')}
          data-testid="cleaning-pdf-download"
        >
          <Download className="size-4" aria-hidden />
          {t('action.download')} A4
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => void pdf.print(task, 'a4')}
          data-testid="cleaning-pdf-print"
        >
          <Printer className="size-4" aria-hidden />
          {t('action.print')} A4
        </Button>
        <Button
          type="button"
          className="h-12"
          onClick={() => void pdf.download(task, 'a3')}
        >
          <Download className="size-4" aria-hidden />
          {t('action.download')} A3
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={() => void pdf.print(task, 'a3')}
        >
          <Printer className="size-4" aria-hidden />
          {t('action.print')} A3
        </Button>
      </div>
    </section>
  );
}
