'use client';

/** Rapport-PDF herunterladen, drucken und als E-Mail vorbereiten. */
import { Download, Mail, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { useReportPdf } from '@/lib/reports/use-report-pdf';
import { Report } from '@/lib/types';

export function ReportPdfPanel({ report }: { report: Report }) {
  const t = useT();
  const pdf = useReportPdf();
  const recipient = pdf.recipient(report);

  const send = async () => {
    if (!recipient) {
      toast.error(t('report.sendNoEmail'));
      return;
    }
    /** Ohne Mailanbieter kann der Browser keine Datei anhaengen: erst laden, dann Entwurf oeffnen. */
    await pdf.download(report);
    window.location.href = pdf.mailtoUrl(report);
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4" data-testid="report-pdf">
      <div>
        <h2 className="text-base font-semibold">{t('report.pdfTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('report.pdfHint')}</p>
        {report.signature ? null : (
          <p className="mt-2 text-sm text-muted-foreground" data-testid="pdf-unsigned-hint">
            {t('report.pdfUnsigned')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button className="h-12" onClick={() => void pdf.download(report)} data-testid="pdf-download">
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() => void pdf.print(report)}
          data-testid="pdf-print"
        >
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </Button>
        <Button variant="outline" className="h-12" onClick={() => void send()} data-testid="pdf-send">
          <Mail className="size-4" aria-hidden />
          {t('report.send')}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground" data-testid="pdf-send-hint">
        {t('report.sendHint')}
      </p>
      {recipient ? (
        <p className="text-xs text-muted-foreground" data-testid="pdf-recipient">
          {t('common.email')}: {recipient}
        </p>
      ) : null}
    </section>
  );
}
