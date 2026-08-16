'use client';

import { useRouter } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { EntityDetail } from '@/components/module/entity-detail';
import { MaterialEditor } from '@/components/module/material-editor';
import { ReportPdfPanel } from '@/components/modules/report-pdf-panel';
import { ReportSignDialog } from '@/components/modules/report-sign-dialog';
import { ReportSignature } from '@/components/modules/report-signature';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import { useInvoicePdf } from '@/lib/invoices/use-invoice-pdf';
import { useInvoiceFromReport } from '@/lib/reports/to-invoice';

export function ReportDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const createInvoice = useInvoiceFromReport();
  const invoicePdf = useInvoicePdf();

  return (
    <EntityDetail
      collection="reports"
      id={id}
      headerExtra={(report, update) => (
        <>
          <ReportSignDialog report={report} onChange={update} />
          {report.signature ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const invoice = createInvoice(report, t('report.workPosition'));
                /** Die Rechnung ist gespeichert; das PDF folgt direkt aus demselben Datensatz. */
                invoicePdf.download(invoice);
                toast.success(t('report.invoiceCreated'), { description: t('report.invoiceHint') });
                router.push(`/invoices/${invoice.id}`);
              }}
              data-testid="report-create-invoice"
            >
              <Receipt className="size-4" aria-hidden />
              {t('report.toInvoice')}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground" data-testid="invoice-needs-signature">
              {t('report.invoiceNeedsSignature')}
            </span>
          )}
        </>
      )}
      extraTabs={(report, update) => [
        {
          value: 'materials',
          labelKey: 'tab.material',
          content: (
            <MaterialEditor items={report.materials} onChange={(materials) => update({ materials })} />
          ),
        },
        {
          value: 'signature',
          labelKey: 'tab.signature',
          content: <ReportSignature report={report} onChange={update} />,
        },
        {
          value: 'pdf',
          labelKey: 'tab.pdf',
          content: <ReportPdfPanel report={report} />,
        },
      ]}
    />
  );
}
