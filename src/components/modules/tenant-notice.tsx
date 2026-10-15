'use client';

/**
 * Mieter-Aushang der Liegenschaft.
 *
 * Titel und Text eingeben, fertig ist ein Aushang als PDF - zum
 * Ausdrucken und Aufhaengen im Treppenhaus.
 */
import { useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { logoOf } from '@/lib/branding/logo';
import { Property } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

export function TenantNotice({ property }: { property: Property }) {
  const t = useT();
  const { settings } = useSettings();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [busy, setBusy] = useState(false);

  const produce = async (action: 'open' | 'download') => {
    if (!subject.trim() || !text.trim()) {
      toast.error(t('notice.missing'));
      return;
    }
    setBusy(true);
    try {
      const [{ buildDocumentPdf, documentPdfFileName }, output] = await Promise.all([
        import('@/lib/pdf/document-pdf'),
        import('@/lib/pdf/output'),
      ]);
      const address = settings.companyAddress;
      const locationLine = [
        property.name || property.number,
        [property.address.street, [property.address.zip, property.address.city].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', '),
      ]
        .filter(Boolean)
        .join(' · ');
      const doc = buildDocumentPdf(
        {
          kind: t('notice.title'),
          title: subject.trim(),
          number: property.number,
          date: formatDate(new Date().toISOString().slice(0, 10), settings.language),
          status: '',
          sections: [
            { kind: 'pairs', title: property.name || property.number, pairs: [
              { label: t('module.properties.singular'), value: locationLine },
              ...(validUntil
                ? [{ label: t('notice.validUntil'), value: formatDate(validUntil, settings.language) }]
                : []),
            ] },
            { kind: 'text', title: subject.trim(), text: text.trim() },
          ],
        },
        {
          companyName: settings.companyName || 'Facility365',
          companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
            .filter(Boolean)
            .join(', '),
          companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
          logo: logoOf(settings.companyLogo),
          createdLabel: t('pdf.created'),
          pageLabel: t('pdf.page'),
          createdAt: formatDate(new Date().toISOString().slice(0, 10), settings.language),
        },
      );
      const fileName = documentPdfFileName({
        kind: t('notice.title'),
        title: subject.trim(),
        number: property.number,
        date: '',
        status: '',
        sections: [],
      });
      if (action === 'open') output.openPdf(doc);
      else output.downloadPdf(doc, fileName);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t('notice.hint')}</p>
      <div className="grid w-full gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-subject">{t('notice.subject')}</Label>
          <Input
            id="notice-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-text">{t('notice.text')}</Label>
          <Textarea
            id="notice-text"
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-until">{t('notice.validUntil')}</Label>
          <Input
            id="notice-until"
            type="date"
            value={validUntil}
            onChange={(event) => setValidUntil(event.target.value)}
            className="h-11"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void produce('open')}>
          <FileText className="size-4" aria-hidden />
          {t('notice.open')}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void produce('download')}>
          <FileDown className="size-4" aria-hidden />
          {t('notice.download')}
        </Button>
      </div>
    </div>
  );
}
