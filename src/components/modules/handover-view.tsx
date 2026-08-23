'use client';

/** Objektuebergabe: Liegenschaft waehlen, Bestand sehen, Uebergabebericht als PDF. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { AuditPdfLabels } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useHandoverSections } from '@/lib/handover/handover';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';

const ALL = 'all';

export function HandoverView() {
  const t = useT();
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  const [property, setProperty] = useState(ALL);
  const [building, setBuilding] = useState(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');

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

  const createPdf = async () => {
    const labels: AuditPdfLabels = {
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
    };

    /** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    downloadAuditPdf(
      {
        location: locationText,
        period: formatDate(date, settings.language),
        createdAt: formatDate(today(), settings.language),
        green: 0,
        amber: 0,
        red: 0,
        showSummary: false,
        fileBaseName: 'Uebergabebericht',
        infoLines: [
          `${t('handover.from')}: ${from || '–'}`,
          `${t('handover.to')}: ${to || '–'}`,
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
      },
      labels,
      {
        companyName: settings.companyName || 'Facility365',
        companyAddress: [
          settings.companyAddress.street,
          [settings.companyAddress.zip, settings.companyAddress.city].filter(Boolean).join(' '),
        ]
          .filter(Boolean)
          .join(', '),
        companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
        logo: logoOf(settings.companyLogo),
      },
    );
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
