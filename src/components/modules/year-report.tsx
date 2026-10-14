'use client';

/**
 * Jahresbericht einer Liegenschaft als PDF.
 *
 * Ein Klick: Auftraege, Schaeden, Kontrollen, Wartungen und Rechnungen
 * des Jahres - im einheitlichen Facility365-Layout.
 */
import { useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { lineItemTotals } from '@/components/module/line-item-editor';
import { logoOf } from '@/lib/branding/logo';
import { PdfSection } from '@/lib/pdf/document-pdf';
import { Building, Invoice, Property } from '@/lib/types';

const gross = (invoice: Invoice) => lineItemTotals(invoice.items).gross;

export function YearReport({ property }: { property: Property }) {
  const t = useT();
  const { settings } = useSettings();
  const orders = useCollectionItems('orders');
  const damages = useCollectionItems('damages');
  const invoices = useCollectionItems('invoices');
  const maintenances = useCollectionItems('maintenances');
  const inspections = useCollectionItems('inspections');
  const firechecks = useCollectionItems('firechecks');
  const playgroundchecks = useCollectionItems('playgroundchecks');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const buildings = useCollectionItems('buildings');
  const [busy, setBusy] = useState(false);

  const years = useMemo(() => {
    const found = new Set<number>([new Date().getFullYear()]);
    const collect = (value?: string) => {
      const year = Number((value ?? '').slice(0, 4));
      if (year > 2000 && year < 2100) found.add(year);
    };
    orders.forEach((entry) => {
      if (entry.propertyId === property.id) collect(entry.dueDate || entry.createdAt);
    });
    invoices.forEach((entry) => {
      if (entry.propertyId === property.id) collect(entry.dueDate || entry.createdAt);
    });
    return [...found].sort((a, b) => b - a);
  }, [orders, invoices, property.id]);

  const [year, setYear] = useState(new Date().getFullYear());
  const inYear = (value?: string) => (value ?? '').slice(0, 10).startsWith(String(year));
  const buildingIds = useMemo(
    () => new Set(buildings.filter((entry) => entry.propertyId === property.id).map((entry) => entry.id)),
    [buildings, property.id],
  );
  const belongs = (entry: { propertyId?: string; buildingId?: string }) =>
    entry.propertyId === property.id || (entry.buildingId ? buildingIds.has(entry.buildingId) : false);

  const yearOrders = orders.filter((entry) => belongs(entry) && inYear(entry.dueDate || entry.createdAt));
  const yearDamages = damages.filter((entry) => belongs(entry) && inYear(entry.reportedAt || entry.createdAt));
  const yearInvoices = invoices.filter((entry) => belongs(entry) && inYear(entry.dueDate || entry.createdAt));
  const controls = [
    ...maintenances.filter((entry) => belongs(entry) && (inYear(entry.lastDate) || inYear(entry.nextDate) || inYear(entry.createdAt))),
    ...inspections.filter((entry) => belongs(entry) && (inYear(entry.date) || inYear(entry.createdAt))),
    ...firechecks.filter((entry) => belongs(entry) && (inYear(entry.date) || inYear(entry.createdAt))),
    ...playgroundchecks.filter((entry) => belongs(entry) && (inYear(entry.date) || inYear(entry.createdAt))),
    ...legionella.filter((entry) => belongs(entry) && (inYear(entry.date) || inYear(entry.createdAt))),
    ...rcd.filter((entry) => belongs(entry) && (inYear(entry.date) || inYear(entry.createdAt))),
  ];
  const invoiceTotal = yearInvoices
    .filter((entry) => entry.status !== 'cancelled')
    .reduce((sum, entry) => sum + gross(entry), 0);
  const openDamages = yearDamages.filter((entry) => entry.status !== 'fixed' && entry.status !== 'rejected').length;

  const run = async (action: 'open' | 'download') => {
    setBusy(true);
    try {
      const [{ buildDocumentPdf, documentPdfFileName }, output] = await Promise.all([
        import('@/lib/pdf/document-pdf'),
        import('@/lib/pdf/output'),
      ]);
      const sections: PdfSection[] = [
        {
          kind: 'pairs',
          title: t('yearReport.summary'),
          pairs: [
            { label: t('module.orders'), value: String(yearOrders.length) },
            {
              label: t('yearReport.ordersDone'),
              value: String(yearOrders.filter((entry) => entry.status === 'done').length),
            },
            { label: t('module.damages'), value: `${yearDamages.length} (${openDamages} ${t('status.open')})` },
            {
              label: t('yearReport.controls'),
              value: String(controls.length),
            },
            {
              label: t('module.invoices'),
              value: `${yearInvoices.length} · ${formatMoney(invoiceTotal, settings.currency)}`,
            },
          ],
        },
      ];
      if (yearOrders.length > 0) {
        sections.push({
          kind: 'table',
          title: t('module.orders'),
          head: [t('common.number'), t('common.title'), t('common.date'), t('common.status')],
          rows: yearOrders
            .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
            .map((entry) => [
              entry.number,
              entry.title,
              formatDate(entry.dueDate || entry.createdAt.slice(0, 10), settings.language),
              t(`status.${entry.status}` as never),
            ]),
        });
      }
      if (controls.length > 0) {
        sections.push({
          kind: 'table',
          title: t('yearReport.controls'),
          head: [t('common.number'), t('common.title'), t('common.date')],
          rows: controls
            .sort((a, b) => (a.nextDate || a.createdAt).localeCompare(b.nextDate || b.createdAt))
            .map((entry) => [
              entry.number,
              ('title' in entry && entry.title ? String(entry.title) : '') ||
                ('measuringPoint' in entry && entry.measuringPoint ? String(entry.measuringPoint) : ''),
              formatDate(
                ('date' in entry && entry.date ? entry.date : '') ||
                  ('nextDate' in entry && entry.nextDate ? entry.nextDate : '') ||
                  entry.createdAt.slice(0, 10),
                settings.language,
              ),
            ]),
        });
      }
      if (yearInvoices.length > 0) {
        sections.push({
          kind: 'table',
          title: t('module.invoices'),
          head: [t('common.number'), t('common.date'), t('common.status'), t('invoice.gross')],
          rows: yearInvoices
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((entry) => [
              entry.number,
              formatDate(entry.dueDate || entry.createdAt.slice(0, 10), settings.language),
              t(`status.${entry.status}` as never),
              formatMoney(gross(entry), entry.currency || settings.currency),
            ]),
        });
      }

      const address = settings.companyAddress;
      const doc = buildDocumentPdf(
        {
          kind: t('yearReport.kind'),
          title: property.name || property.number,
          number: `${property.number} · ${year}`,
          date: formatDate(String(year), settings.language).slice(-4),
          status: '',
          sections,
        },
        {
          companyName: settings.companyName || 'Facility365',
          companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
            .filter(Boolean)
            .join(', '),
          companyContact: [settings.companyPhone, settings.companyEmail]
            .filter(Boolean)
            .join(' · '),
          logo: logoOf(settings.companyLogo),
          createdLabel: t('pdf.created'),
          pageLabel: t('pdf.page'),
          createdAt: formatDate(new Date().toISOString().slice(0, 10), settings.language),
        },
      );
      const fileName = documentPdfFileName({
        kind: t('yearReport.kind'),
        title: property.name || property.number,
        number: `${property.number}-${year}`,
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
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t('yearReport.hint')}</p>
      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="font-medium">{t('common.year')}</span>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {years.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void run('open')} data-testid="year-report-open">
          <FileText className="size-4" aria-hidden />
          {t('yearReport.open')}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('download')}>
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </Button>
      </div>
    </div>
  );
}
