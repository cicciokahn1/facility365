'use client';

/** Auditmodus: Standort und Zeitraum waehlen, Ampelstatus sehen, Bericht als PDF. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditTone, countTones, useAuditSections } from '@/lib/audit/audit';
import { AuditPdfLabels, downloadAuditPdf } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { cn } from '@/lib/utils';
import { formatDate, today } from '@/lib/utils/format';

const ALL = 'all';

/** Farbe der Ampel. */
const TONE_CLASS: Record<AuditTone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-destructive',
};

/** Vorgabe: das laufende Jahr. */
const yearStart = (): string => `${new Date().getFullYear()}-01-01`;

export function AuditView() {
  const t = useT();
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  const [property, setProperty] = useState(ALL);
  const [building, setBuilding] = useState(ALL);
  const [from, setFrom] = useState(yearStart());
  const [to, setTo] = useState(today());

  const buildingChoices = useMemo(
    () => (property === ALL ? buildings : buildings.filter((item) => item.propertyId === property)),
    [buildings, property],
  );

  const filter = useMemo(
    () => ({
      propertyId: property === ALL ? '' : property,
      buildingId: building === ALL ? '' : building,
      from,
      to,
    }),
    [building, from, property, to],
  );

  const sections = useAuditSections(filter);
  const tones = countTones(sections);
  const total = tones.green + tones.amber + tones.red;

  const locationText = [
    properties.find((item) => item.id === filter.propertyId)?.name,
    buildings.find((item) => item.id === filter.buildingId)?.name,
  ]
    .filter(Boolean)
    .join(' · ') || t('audit.allLocations');

  const periodText = `${formatDate(from, settings.language)} – ${formatDate(to, settings.language)}`;

  const createPdf = () => {
    const labels: AuditPdfLabels = {
      title: t('audit.reportTitle'),
      location: t('audit.location'),
      period: t('audit.period'),
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

    downloadAuditPdf(
      {
        location: locationText,
        period: periodText,
        createdAt: formatDate(today(), settings.language),
        green: tones.green,
        amber: tones.amber,
        red: tones.red,
        sections: sections.map((section) => ({
          title: t(section.labelKey),
          rows: section.rows.map((row) => ({
            tone: row.tone,
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
    <div className="flex flex-col gap-4" data-testid="audit-view">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('module.audit')}</CardTitle>
          <Button onClick={createPdf} data-testid="audit-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('audit.createReport')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('module.properties.singular')}</Label>
              <Select
                value={property}
                onValueChange={(value) => {
                  setProperty(value);
                  setBuilding(ALL);
                }}
              >
                <SelectTrigger data-testid="audit-property">
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
                <SelectTrigger data-testid="audit-building">
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
              <Label htmlFor="audit-from">{t('audit.from')}</Label>
              <Input
                id="audit-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                data-testid="audit-from"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="audit-to">{t('audit.to')}</Label>
              <Input
                id="audit-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                data-testid="audit-to"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" data-testid="audit-summary">
            {([
              ['green', t('audit.green'), tones.green],
              ['amber', t('audit.amber'), tones.amber],
              ['red', t('audit.red'), tones.red],
            ] as [AuditTone, string, number][]).map(([tone, label, count]) => (
              <div
                key={tone}
                className="flex items-center gap-3 rounded-lg border p-3"
                data-testid={`audit-count-${tone}`}
              >
                <span className={cn('size-3 rounded-full', TONE_CLASS[tone])} aria-hidden />
                <span className="text-lg font-semibold">{count}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="audit-empty">
              {t('audit.noData')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.key} data-testid={`audit-section-${section.key}`}>
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
                      data-testid="audit-row"
                      data-tone={row.tone}
                    >
                      <span className={cn('size-3 shrink-0 rounded-full', TONE_CLASS[row.tone])} aria-hidden />
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
