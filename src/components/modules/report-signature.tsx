'use client';

/**
 * Unterschrift des Kunden auf dem Rapport.
 *
 * Der Kunde unterschreibt auf dem Geraet des Hauswarts; ein Konto braucht er
 * dafuer nicht. Gespeichert werden Unterschrift, Name und Zeitpunkt.
 */
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { SignaturePad } from '@/components/modules/signature-pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Report } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/format';

/**
 * Erfassung der Unterschrift: Name, Zeichenflaeche, Bestaetigung.
 *
 * Wird sowohl im Bereich „Unterschrift“ als auch im Kopf des Rapports
 * verwendet, damit beide Wege denselben Ablauf und dasselbe Ergebnis haben.
 */
export function SignatureForm({
  report,
  onChange,
  onSigned,
}: {
  report: Report;
  onChange: (values: Partial<Report>, action?: string) => void;
  onSigned?: () => void;
}) {
  const t = useT();
  const [drawing, setDrawing] = useState('');
  const [name, setName] = useState(report.signedBy);

  const confirm = () => {
    if (!drawing || !name.trim()) {
      toast.error(t('report.signMissing'));
      return;
    }
    onChange(
      {
        signature: drawing,
        signedBy: name.trim(),
        signedAt: new Date().toISOString(),
        /** Mit der Unterschrift ist der Rapport definitiv. */
        status: 'final',
      },
      'history.signed',
    );
    setDrawing('');
    toast.success(t('report.signedDone'));
    onSigned?.();
  };

  return (
    <section className="flex flex-col gap-4" data-testid="report-signature">
      <p className="text-sm text-muted-foreground">{t('report.signNoAccount')}</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signer-name">{t('report.signerName')}</Label>
        <Input
          id="signer-name"
          className="h-11"
          value={name}
          onChange={(event) => setName(event.target.value)}
          data-testid="signer-name"
        />
      </div>
      <SignaturePad onChange={setDrawing} />
      <Button className="h-12 text-base" onClick={confirm} data-testid="sign-confirm">
        {t('report.signConfirm')}
      </Button>
    </section>
  );
}

export function ReportSignature({
  report,
  onChange,
}: {
  report: Report;
  onChange: (values: Partial<Report>, action?: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [again, setAgain] = useState(false);

  const signed = Boolean(report.signature) && !again;

  if (signed) {
    return (
      <section className="flex flex-col gap-4" data-testid="report-signature">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden />
            {t('report.signedDone')}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.signature}
            alt={t('report.signature')}
            className="h-24 w-full max-w-xs self-start rounded-lg border bg-background object-contain"
            data-testid="signature-image"
          />
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t('report.signedBy')}</dt>
              <dd className="text-sm font-medium" data-testid="signed-by">
                {report.signedBy}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('report.signedAt')}</dt>
              <dd className="text-sm font-medium" data-testid="signed-at">
                {formatDateTime(report.signedAt, settings.language)}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="h-11 self-start"
            onClick={() => setAgain(true)}
            data-testid="sign-again"
          >
            {t('report.signAgain')}
          </Button>
        </div>
      </section>
    );
  }

  return <SignatureForm report={report} onChange={onChange} onSigned={() => setAgain(false)} />;
}
