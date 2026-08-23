'use client';

/** Managementbericht: Kennzahlen und Vergleiche fuer Monat, Jahr oder freien Zeitraum. */
import { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AuditPdfLabels } from '@/lib/audit/audit-pdf';
import { logoOf } from '@/lib/branding/logo';
import type { Language } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import {
  ComparisonRow,
  ManagementMetric,
  monthRange,
  useManagementReport,
  yearRange,
} from '@/lib/reports/management';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, formatMoney, formatNumber, today } from '@/lib/utils/format';

type Mode = 'month' | 'year' | 'custom';

export function ManagementReport() {
  const t = useT();
  const { settings } = useSettings();
  const now = today();

  const [mode, setMode] = useState<Mode>('month');
  const [month, setMonth] = useState(now.slice(0, 7));
  const [year, setYear] = useState(now.slice(0, 4));
  const [from, setFrom] = useState(`${now.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(now);

  const range = useMemo(() => {
    if (mode === 'month') return monthRange(month);
    if (mode === 'year') return yearRange(year);
    return { from, to };
  }, [from, mode, month, to, year]);

  const report = useManagementReport(range);

  const years = useMemo(() => {
    const current = Number(now.slice(0, 4));
    return [current + 1, current, current - 1, current - 2, current - 3].map(String);
  }, [now]);

  const periodText = `${formatDate(range.from, settings.language)} – ${formatDate(range.to, settings.language)}`;

  const label = (row: ComparisonRow): string => row.label || t('report.unassigned');

  const createPdf = async () => {
    const labels: AuditPdfLabels = {
      title: t('report.title'),
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
      empty: t('list.empty'),
    };

    const head = [
      t('common.title'),
      t('module.orders'),
      t('module.damages'),
      t('module.maintenances'),
      t('module.cleaning'),
      t('module.inspections'),
      t('report.energyCost'),
    ];
    const tableRows = (rows: ComparisonRow[]): string[][] =>
      rows.map((row) => [
        label(row),
        String(row.orders),
        String(row.damages),
        String(row.maintenances),
        String(row.cleaning),
        String(row.inspections),
        row.energyCost > 0 ? formatMoney(row.energyCost) : '–',
      ]);

    /** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
    const { downloadAuditPdf } = await import('@/lib/audit/audit-pdf');
    downloadAuditPdf(
      {
        location: t('audit.allLocations'),
        period: periodText,
        createdAt: formatDate(now, settings.language),
        green: 0,
        amber: 0,
        red: 0,
        showSummary: false,
        fileBaseName: 'Managementbericht',
        metrics: report.metrics.map((metric) => ({
          label: t(metric.labelKey),
          value: metricText(metric, settings.language),
        })),
        sections: [],
        tables: [
          { title: t('report.byProperty'), head, rows: tableRows(report.properties) },
          { title: t('report.byBuilding'), head, rows: tableRows(report.buildings) },
        ],
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
    <div className="flex flex-col gap-4" data-testid="management-report">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('report.title')}</CardTitle>
          <Button onClick={() => void createPdf()} data-testid="report-pdf">
            <FileDown className="size-4" aria-hidden />
            {t('report.createReport')}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('report.hint')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t('audit.period')}</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as Mode)}>
                <SelectTrigger data-testid="report-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t('report.month')}</SelectItem>
                  <SelectItem value="year">{t('report.year')}</SelectItem>
                  <SelectItem value="custom">{t('report.custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === 'month' ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="report-month">{t('report.month')}</Label>
                <Input
                  id="report-month"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  data-testid="report-month"
                />
              </div>
            ) : null}
            {mode === 'year' ? (
              <div className="flex flex-col gap-1.5">
                <Label>{t('report.year')}</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger data-testid="report-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {mode === 'custom' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="report-from">{t('audit.from')}</Label>
                  <Input
                    id="report-from"
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    data-testid="report-from"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="report-to">{t('audit.to')}</Label>
                  <Input
                    id="report-to"
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    data-testid="report-to"
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {report.metrics.map((metric) => (
              <div key={metric.key} data-testid={`report-metric-${metric.key}`}>
                <p className="truncate text-xs text-muted-foreground">{t(metric.labelKey)}</p>
                <p
                  className={`text-xl font-semibold tabular-nums ${
                    metric.alert && metric.value > 0 ? 'text-destructive' : ''
                  }`}
                >
                  {metricText(metric, settings.language)}
                </p>
              </div>
            ))}
          </div>

          {report.energyCostPrevious > 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="report-energy-previous">
              {t('energy.previousYear')}: {formatMoney(report.energyCostPrevious)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <ComparisonTable
        titleKey="report.byProperty"
        testId="report-properties"
        rows={report.properties}
        label={label}
        language={settings.language}
      />
      <ComparisonTable
        titleKey="report.byBuilding"
        testId="report-buildings"
        rows={report.buildings}
        label={label}
        language={settings.language}
      />
    </div>
  );
}

/** Kennzahl als Text: Betrag oder Anzahl. */
const metricText = (metric: ManagementMetric, language: Language): string =>
  metric.currency ? formatMoney(metric.value) : formatNumber(metric.value, language);

function ComparisonTable({
  titleKey,
  testId,
  rows,
  label,
  language,
}: {
  titleKey: 'report.byProperty' | 'report.byBuilding';
  testId: string;
  rows: ComparisonRow[];
  label: (row: ComparisonRow) => string;
  language: Language;
}) {
  const t = useT();
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-base">{t(titleKey)}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('list.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 text-left font-normal">{t('common.title')}</th>
                  <th className="py-2 text-right font-normal">{t('module.orders')}</th>
                  <th className="py-2 text-right font-normal">{t('module.damages')}</th>
                  <th className="py-2 text-right font-normal">{t('module.maintenances')}</th>
                  <th className="py-2 text-right font-normal">{t('module.cleaning')}</th>
                  <th className="py-2 text-right font-normal">{t('module.inspections')}</th>
                  <th className="py-2 text-right font-normal">{t('report.energyCost')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0" data-testid="report-row">
                    <td className="py-2 pr-3">{label(row)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(row.orders, language)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(row.damages, language)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(row.maintenances, language)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(row.cleaning, language)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatNumber(row.inspections, language)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {row.energyCost > 0 ? formatMoney(row.energyCost) : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
