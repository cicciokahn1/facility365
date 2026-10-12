'use client';

/**
 * PDF eines Datensatzes im einheitlichen Facility365-Layout.
 *
 * Die Angaben kommen aus der Modulbeschreibung - dieselben Felder wie in den
 * Stammdaten -, ergaenzt um Checkliste, Material, Fotos und Unterschrift,
 * sofern der Datensatz sie hat.
 */
import { useCallback } from 'react';
import { Download, ExternalLink, FileDown, Printer, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoOf } from '@/lib/branding/logo';
import { indexOf, useAllCollections } from '@/lib/data/store';
import { fieldValue, valuesOf } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import type { DocumentPdfData, PdfPair, PdfSection } from '@/lib/pdf/document-pdf';
import { asString } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import type { BaseEntity, ChecklistItem, CollectionKey, MaterialItem } from '@/lib/types';
import { dictionary, type TranslationKey } from '@/lib/i18n/dictionary';
import { formatDate, formatDateTime, formatMoney, formatMonth } from '@/lib/utils/format';

/** Module mit PDF-Export im Kopf der Detailansicht. */
export const PDF_COLLECTIONS: ReadonlySet<CollectionKey> = new Set<CollectionKey>([
  'orders',
  'maintenances',
  'inspections',
  'rcd',
  'firechecks',
  'playgroundchecks',
  'legionella',
  'damages',
  'tickets',
  'cleaningchecks',
]);

const pdfModule = () => import('@/lib/pdf/document-pdf');
const outputModule = () => import('@/lib/pdf/output');

type Action = 'open' | 'download' | 'share' | 'print';

export function PdfExportButton({
  collection,
  entity,
}: {
  collection: CollectionKey;
  entity: BaseEntity;
}) {
  const t = useT();
  const { settings } = useSettings();
  const store = useAllCollections();

  const build = useCallback((): DocumentPdfData => {
    const config = configOf(collection);
    const values = valuesOf(entity);
    const pairs: PdfPair[] = [];
    const texts: PdfSection[] = [];
    let status = '';

    for (const field of config.fields) {
      if (field.visibleWhen && !field.visibleWhen(values)) continue;
      const raw = fieldValue(entity, field.name);
      const label = t(field.labelKeyOf ? field.labelKeyOf(values) : field.labelKey);
      let display = '';
      switch (field.kind) {
        case 'relation': {
          const target = indexOf(store[field.collection] ?? []).get(asString(raw));
          display = target ? titleOfEntity(field.collection, target) : '';
          break;
        }
        case 'select': {
          const option = field.options.find((entry) => entry.value === asString(raw));
          display = option ? t(option.labelKey) : '';
          break;
        }
        case 'date':
          display = asString(raw) ? formatDate(asString(raw), settings.language) : '';
          break;
        case 'month':
          display = asString(raw) ? formatMonth(asString(raw), settings.language) : '';
          break;
        case 'money':
          display = typeof raw === 'number' ? formatMoney(raw, settings.currency) : '';
          break;
        case 'switch':
          display = raw === true ? t('common.yes') : t('common.no');
          break;
        case 'address': {
          const address = (raw ?? {}) as { street?: string; zip?: string; city?: string };
          display = [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
            .filter(Boolean)
            .join(', ');
          break;
        }
        default:
          display = asString(raw);
      }
      if (!display) continue;
      if (field.name === config.statusField) {
        status = display;
        continue;
      }
      if (field.kind === 'textarea') texts.push({ kind: 'text', title: label, text: display });
      else pairs.push({ label, value: display });
    }

    const sections: PdfSection[] = [];
    if (pairs.length) sections.push({ kind: 'pairs', title: t('tab.master'), pairs });
    sections.push(...texts);
    if (entity.notes) sections.push({ kind: 'text', title: t('common.notes'), text: entity.notes });

    const checklist = fieldValue(entity, 'checklist');
    if (Array.isArray(checklist) && checklist.length) {
      sections.push({
        kind: 'checklist',
        title: t('tab.checklist'),
        items: (checklist as ChecklistItem[]).map((item) => ({
          /** SUVA-Vorlagenpunkte werden im PDF lokalisiert ausgegeben. */
          text: item.text in dictionary ? t(item.text as TranslationKey) : item.text,
          done: item.done,
        })),
      });
    }
    const materials = fieldValue(entity, 'materials');
    if (Array.isArray(materials) && materials.length) {
      const list = materials as MaterialItem[];
      sections.push({
        kind: 'table',
        title: t('tab.material'),
        head: [t('tab.material'), t('common.quantity'), t('common.price'), t('common.total')],
        rows: list.map((item) => [
          item.name,
          `${item.quantity} ${item.unit}`.trim(),
          formatMoney(item.price, settings.currency),
          formatMoney(item.quantity * item.price, settings.currency),
        ]),
      });
    }
    if (entity.photos.length) {
      sections.push({
        kind: 'photos',
        title: t('tab.photos'),
        photos: entity.photos.map((photo) => ({ url: photo.url, caption: photo.caption ?? '' })),
      });
    }
    const signature = asString(fieldValue(entity, 'signature'));
    const signedBy = asString(fieldValue(entity, 'signedBy'));
    if (signature || signedBy || collection === 'orders') {
      sections.push({
        kind: 'signature',
        title: t('report.signature'),
        image: signature,
        caption: signedBy ? `${t('report.signedBy')}: ${signedBy}` : '',
        empty: t('report.notSigned'),
      });
    }

    const moduleDef = moduleByCollection(collection);
    const dateRaw =
      asString(fieldValue(entity, 'date')) ||
      asString(fieldValue(entity, 'dueDate')) ||
      entity.createdAt.slice(0, 10);
    return {
      kind: t(moduleDef.singularKey),
      title: titleOfEntity(collection, entity),
      number: entity.number,
      date: formatDate(dateRaw, settings.language),
      status,
      sections,
    };
  }, [collection, entity, settings.currency, settings.language, store, t]);

  const run = async (action: Action) => {
    const [{ buildDocumentPdf, documentPdfFileName }, output] = await Promise.all([
      pdfModule(),
      outputModule(),
    ]);
    const data = build();
    const address = settings.companyAddress;
    const doc = buildDocumentPdf(data, {
      companyName: settings.companyName || 'Facility365',
      companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', '),
      companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
      logo: logoOf(settings.companyLogo),
      createdLabel: t('pdf.created'),
      pageLabel: t('pdf.page'),
      createdAt: formatDateTime(new Date().toISOString(), settings.language),
    });
    const fileName = documentPdfFileName(data);
    if (action === 'open') output.openPdf(doc);
    else if (action === 'download') output.downloadPdf(doc, fileName);
    else if (action === 'print') output.printPdf(doc);
    else await output.sharePdf(doc, fileName, `${data.kind} ${data.number}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" data-testid="pdf-export">
          <FileDown className="size-4" aria-hidden />
          PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => void run('open')}>
          <ExternalLink className="size-4" aria-hidden />
          {t('action.open')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run('download')}>
          <Download className="size-4" aria-hidden />
          {t('action.download')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run('share')}>
          <Share2 className="size-4" aria-hidden />
          {t('action.share')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run('print')}>
          <Printer className="size-4" aria-hidden />
          {t('action.print')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
