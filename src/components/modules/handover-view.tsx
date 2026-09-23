'use client';

/** Objektuebergabe: Liegenschaft waehlen, Bestand sehen, Uebergabebericht als PDF. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileDown } from 'lucide-react';

import { SignaturePad } from '@/components/modules/signature-pad';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AuditPdfLabels } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useHandoverSections } from '@/lib/handover/handover';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';
import { newId } from '@/lib/utils/id';
import type { DocumentEntity } from '@/lib/types';
import { toast } from 'sonner';

const ALL = 'all';

export function HandoverView() {
  const t = useT();
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const customers = useCollectionItems('customers');
  const documents = useCollection('documents');

  const [property, setProperty] = useState(ALL);
  const [building, setBuilding] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'completed'>('draft');
  const [fromSignature, setFromSignature] = useState('');
  const [toSignature, setToSignature] = useState('');

  const buildingChoices = useMemo(
    () => (property === ALL ? buildings : buildings.filter((item) => item.propertyId === property)),
    [buildings, property],
  );

  const filter = useMemo(
    () => ({
      propertyId: property === ALL ? '' : property,
      buildingId: building === ALL ? '' : building,
    }),
    [building, property],
  );

  const sections = useHandoverSections(filter);
  const total = sections.reduce((sum, section) => sum + section.rows.length, 0);

  const locationText =
    [
      properties.find((item) => item.id === filter.propertyId)?.name,
      buildings.find((item) => item.id === filter.buildingId)?.name,
    ]
      .filter(Boolean)
      .join(' · ') || t('audit.allLocations');
  const selectedProperty = properties.find((item) => item.id === filter.propertyId);
  const customer = customers.find((item) => item.id === selectedProperty?.customerId);
  const photoCount = sections.find((section) => section.key === 'photos')?.rows.reduce((sum, row) => {
    const count = Number(row.detail.match(/\d+/)?.[0] || 0);
    return sum + count;
  }, 0) || 0;

  const pdfData = () => ({
    location: [customer?.name, locationText].filter(Boolean).join(' · '),
    period: formatDate(date, settings.language),
    createdAt: formatDate(today(), settings.language),
    green: status === 'completed' ? 1 : 0,
    amber: 0,
    red: 0,
    showSummary: true,
    fileBaseName: 'Uebergabebericht',
    infoLines: [
      `${t('handover.from')}: ${from || '–'}`,
      `${t('handover.to')}: ${to || '–'}`,
      `${t('common.status')}: ${status === 'completed' ? t('status.done') : t('status.draft')}`,
      `${t('common.photos')}: ${photoCount}`,
    ],
    notes: { title: t('handover.notes'), text: notes },
    sections: sections.map((section) => ({
      title: t(section.labelKey),
      rows: section.rows.map((row) => ({
        tone: 'green' as const,
        number: row.number,
        title: row.title,
        date: formatDate(row.date, settings.language),
        status: t(row.statusKey),
        detail: row.detail,
      })),
    })),
  });

  const pdfLabels = (): AuditPdfLabels => ({
    title: t('handover.reportTitle'),
    location: t('audit.location'),
    period: t('handover.date'),
    createdAt: t('common.date'),
    summary: t('audit.summary'),
    green: t('audit.green'),
    amber: t('audit.amber'),
    red: t('audit.red'),
    number: t('common.number'),
    subject: t('common.title'),
    date: t('common.date'),
    status: t('common.status'),
    empty: t('audit.sectionEmpty'),
  });

  const branding = {
    companyName: settings.companyName || 'Facility365',
    companyAddress: [
      settings.companyAddress.street,
      [settings.companyAddress.zip, settings.companyAddress.city].filter(Boolean).join(' '),
    ].filter(Boolean).join(', '),
    companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
    logo: logoOf(settings.companyLogo),
  };

  const createPdf = async () => {
    /** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    downloadAuditPdf(pdfData(), pdfLabels(), branding);
  };

  const completeHandover = async () => {
    if (!from || !to || !fromSignature || !toSignature) {
      toast.error(t('handover.signaturesRequired'));
      return;
    }
    const { buildAuditPdf, auditPdfFileName } = await import('@/lib/audit/audit-pdf');
    const pdf = buildAuditPdf(pdfData(), pdfLabels(), branding);
    const dataUrl = pdf.output('datauristring');
    const now = new Date().toISOString();
    const fileName = auditPdfFileName(pdfData());
    const document: Partial<DocumentEntity> = {
      title: `${t('handover.reportTitle')} – ${locationText}`,
      category: 'handover',
      propertyId: filter.propertyId,
      buildingId: filter.buildingId,
      customerId: selectedProperty?.customerId || '',
      file: {
        id: newId('file'),
        name: fileName,
        type: 'PDF',
        mimeType: 'application/pdf',
        url: dataUrl,
        size: dataUrl.length,
        uploadedAt: now,
        uploadedBy: settings.profileName || settings.companyName || 'Facility365',
        linkedModule: 'properties',
        linkedId: filter.propertyId || undefined,
        linkedLabel: locationText,
      },
      notes: [
        notes,
        `${t('handover.from')}: ${from}`,
        `${t('handover.to')}: ${to}`,
        `${t('handover.status')}: ${t('status.done')}`,
      ].filter(Boolean).join('\n'),
    };
    documents.create(document, settings.profileName || settings.companyName);
    setStatus('completed');
    toast.success(t('handover.completed'));
  };

  return (
    <div className="flex flex-col gap-4" data-testid="handover-view">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('module.handover')}</CardTitle>
          <Button onClick={() => void createPdf()} data-testid="handover-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('handover.createReport')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('handover.hint')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t('module.properties.singular')}</Label>
              <Select
                value={property}
                onValueChange={(value) => {
                  setProperty(value);
                  setBuilding(ALL);
                }}
              >
                <SelectTrigger data-testid="handover-property">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('audit.allProperties')}</SelectItem>
                  {properties.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('module.buildings.singular')}</Label>
              <Select value={building} onValueChange={setBuilding}>
                <SelectTrigger data-testid="handover-building">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('audit.allBuildings')}</SelectItem>
                  {buildingChoices.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name || item.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="handover-date">{t('handover.date')}</Label>
              <Input
                id="handover-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                data-testid="handover-date"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="handover-from">{t('handover.from')}</Label>
              <Input
                id="handover-from"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                data-testid="handover-from"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="handover-to">{t('handover.to')}</Label>
              <Input
                id="handover-to"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                data-testid="handover-to"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="handover-notes">{t('handover.notes')}</Label>
            <Textarea
              id="handover-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              data-testid="handover-notes"
            />
          </div>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="text-base">{t('handover.summary')}</CardTitle></CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <span>{t('module.customers.singular')}: {customer?.name || '–'}</span>
              <span>{t('audit.location')}: {locationText}</span>
              <span>{t('handover.summaryItems')}: {total}</span>
              <span>{t('common.status')}: {status === 'completed' ? t('status.done') : t('status.draft')}</span>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle className="text-sm">{t('handover.fromSignature')}</CardTitle></CardHeader><CardContent><SignaturePad onChange={setFromSignature} /></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">{t('handover.toSignature')}</CardTitle></CardHeader><CardContent><SignaturePad onChange={setToSignature} /></CardContent></Card>
          </div>
          <Button onClick={() => void completeHandover()} disabled={status === 'completed'} data-testid="handover-complete">
            <CheckCircle2 className="size-4" aria-hidden />
            {status === 'completed' ? t('handover.completed') : t('handover.complete')}
          </Button>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="handover-empty">
              {t('audit.noData')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.key} data-testid={`handover-section-${section.key}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t(section.labelKey)} ({section.rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('audit.sectionEmpty')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {section.rows.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={row.href}
                      className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent"
                      data-testid="handover-row"
                    >
                      <span className="text-xs text-muted-foreground">{row.number}</span>
                      <span className="font-medium">{row.title}</span>
                      <span className="ml-auto flex flex-wrap items-center gap-3 text-muted-foreground">
                        <span>{formatDate(row.date, settings.language)}</span>
                        <span>{t(row.statusKey)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
