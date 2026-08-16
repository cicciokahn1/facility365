'use client';

/** „Kunde unterschreiben“ im Kopf des Rapports: Unterschrift direkt am Gerät. */
import { useState } from 'react';
import { PenLine } from 'lucide-react';

import { SignatureForm } from '@/components/modules/report-signature';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useT } from '@/lib/i18n/provider';
import { Report } from '@/lib/types';

export function ReportSignDialog({
  report,
  onChange,
}: {
  report: Report;
  onChange: (values: Partial<Report>, action?: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} data-testid="report-sign">
        <PenLine className="size-4" aria-hidden />
        {report.signature ? t('report.signAgain') : t('report.signCustomer')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('report.signCustomer')}</DialogTitle>
            <DialogDescription>{t('report.signDialogHint')}</DialogDescription>
          </DialogHeader>
          <SignatureForm report={report} onChange={onChange} onSigned={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
