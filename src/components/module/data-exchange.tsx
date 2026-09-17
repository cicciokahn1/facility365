'use client';

/**
 * Excel-Austausch einer Modulliste.
 *
 * Der Export schreibt genau die angezeigten Datensaetze, der Import legt neue
 * an. Bestehende Datensaetze werden dabei nie veraendert oder geloescht.
 */
import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAllCollections, useCollection } from '@/lib/data/store';
import { fieldValue } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { downloadText, parseCsv, toCsv } from '@/lib/integrations/csv';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { FieldDef, FormValues, asNumber, asString, isAddressValue } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { BaseEntity, CollectionKey } from '@/lib/types';
import { newId } from '@/lib/utils/id';

interface ImportPreview {
  rows: string[][];
  columns: { field: FieldDef; index: number }[];
  checklistIndex: number;
  fileName: string;
  validRows: number;
  duplicateRows: number;
  emptyRows: number;
}

/** Felder, die sich als eine Spalte abbilden lassen. */
const exportable = (field: FieldDef): boolean => field.kind !== 'address';

const cellOf = (
  field: FieldDef,
  entity: BaseEntity,
  t: ReturnType<typeof useT>,
  collections: Record<CollectionKey, BaseEntity[]>,
): string => {
  const raw = fieldValue(entity, field.name);
  if (field.kind === 'switch') return raw === true ? t('common.yes') : t('common.no');
  if (field.kind === 'select') {
    const option = field.options.find((entry) => entry.value === asString(raw));
    return option ? t(option.labelKey) : asString(raw);
  }
  if (field.kind === 'relation') {
    const target = collections[field.collection].find((item) => item.id === asString(raw));
    return target ? titleOfEntity(field.collection, target) : '';
  }
  if (isAddressValue(raw)) return [raw.street, raw.zip, raw.city].filter(Boolean).join(', ');
  return asString(raw);
};

/** Spaltenwert in einen Feldwert wandeln; unbekannte Angaben bleiben leer. */
const valueOf = (
  field: FieldDef,
  cell: string,
  t: ReturnType<typeof useT>,
  collections: Record<CollectionKey, BaseEntity[]>,
): unknown => {
  const text = cell.trim();
  if (field.kind === 'switch') {
    return ['1', 'ja', 'yes', 'oui', 'si', 'true', 'wahr'].includes(text.toLowerCase());
  }
  if (field.kind === 'number' || field.kind === 'money') return asNumber(text) ?? 0;
  if (field.kind === 'select') {
    const option = field.options.find(
      (entry) =>
        entry.value.toLowerCase() === text.toLowerCase() ||
        t(entry.labelKey).toLowerCase() === text.toLowerCase(),
    );
    return option ? option.value : field.options[0]?.value ?? '';
  }
  if (field.kind === 'relation') {
    if (!text) return '';
    const target = collections[field.collection].find(
      (item) =>
        titleOfEntity(field.collection, item).toLowerCase() === text.toLowerCase() ||
        item.number.toLowerCase() === text.toLowerCase(),
    );
    return target ? target.id : '';
  }
  return text;
};

export function DataExchange({
  collection,
  items,
  mayWrite,
}: {
  collection: CollectionKey;
  items: BaseEntity[];
  mayWrite: boolean;
}) {
  const t = useT();
  const config = configOf(collection);
  const collections = useAllCollections();
  const { create } = useCollection(collection);
  const { settings } = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  const fields = config.fields.filter(exportable);
  const checklistColumn = collection === 'cleaningplans';

  const handleExport = () => {
    const header = [
      t('common.number'),
      ...fields.map((field) => t(field.labelKey)),
      ...(checklistColumn ? ['Checkliste'] : []),
    ];
    const rows = items.map((item) => [
      item.number,
      ...fields.map((field) => cellOf(field, item, t, collections)),
      ...(checklistColumn
        ? [[...((item as { checklist?: { text: string }[] }).checklist ?? [])]
            .map((entry) => entry.text)
            .join(' | ')]
        : []),
    ]);
    downloadText(toCsv([header, ...rows]), `${collection}.csv`, 'text/csv');
    toast.success(t('exchange.exported'));
  };

  const prepareImport = async (file: File) => {
    const rows = parseCsv(await file.text());
    const header = rows[0]?.map((cell) => cell.trim().toLowerCase()) ?? [];
    /** Spalten den Feldern zuordnen: Beschriftung oder Feldname zaehlen. */
    const columns = fields.map((field) => ({
      field,
      index: header.findIndex(
        (cell) => cell === t(field.labelKey).toLowerCase() || cell === field.name.toLowerCase(),
      ),
    }));

    if (columns.every((column) => column.index < 0)) {
      toast.error(t('exchange.noColumns'));
      return;
    }

    const existingNumbers = new Set(items.map((item) => item.number.trim().toLowerCase()));
    let duplicateRows = 0;
    let emptyRows = 0;
    let validRows = 0;
    rows.slice(1).forEach((row) => {
      const importedNumber = (row[0] ?? '').trim().toLowerCase();
      const values: FormValues = {};
      columns.forEach(({ field, index }) => {
        if (index < 0) return;
        values[field.name] = valueOf(field, row[index] ?? '', t, collections);
      });
      if (importedNumber && existingNumbers.has(importedNumber)) {
        duplicateRows += 1;
      } else if (Object.values(values).every((value) => value === '' || value === false)) {
        emptyRows += 1;
      } else {
        validRows += 1;
      }
    });

    setPreview({
      rows,
      columns,
      checklistIndex: header.findIndex((cell) => cell === 'checkliste'),
      fileName: file.name,
      validRows,
      duplicateRows,
      emptyRows,
    });
  };

  const handleImport = (next: ImportPreview) => {
    let created = 0;
    const existingNumbers = new Set(items.map((item) => item.number.trim().toLowerCase()));
    next.rows.slice(1).forEach((row) => {
      const importedNumber = (row[0] ?? '').trim().toLowerCase();
      if (importedNumber && existingNumbers.has(importedNumber)) return;
      const values: FormValues = {};
      next.columns.forEach(({ field, index }) => {
        if (index < 0) return;
        values[field.name] = valueOf(field, row[index] ?? '', t, collections);
      });
      if (next.checklistIndex >= 0) {
        const checklist = (row[next.checklistIndex] ?? '')
          .split('|')
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text) => ({ id: newId('chk'), text, done: false }));
        if (checklist.length > 0) values.checklist = checklist;
      }
      if (Object.values(values).every((value) => value === '' || value === false)) return;
      create(values as never, settings.profileName || settings.companyName);
      if (importedNumber) existingNumbers.add(importedNumber);
      created += 1;
    });
    setPreview(null);
    toast.success(`${t('exchange.imported')}: ${created}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-csv">
        <Download className="size-4" aria-hidden />
        {t('exchange.export')}
      </Button>
      {mayWrite ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            data-testid="import-csv"
          >
            <Upload className="size-4" aria-hidden />
            {t('exchange.import')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            data-testid="import-csv-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void prepareImport(file);
            }}
          />
        </>
      ) : null}
      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('exchange.preview')}</DialogTitle>
            <DialogDescription>
              {preview?.fileName} · {t('exchange.previewHint')}
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{t('exchange.validRows')}</p>
                  <p className="text-xl font-semibold">{preview.validRows}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{t('exchange.duplicateRows')}</p>
                  <p className="text-xl font-semibold">{preview.duplicateRows}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{t('exchange.emptyRows')}</p>
                  <p className="text-xl font-semibold">{preview.emptyRows}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[32rem] text-xs">
                  <tbody>
                    {preview.rows.slice(0, 6).map((row: string[], rowIndex: number) => (
                      <tr key={`preview-${rowIndex}`} className="border-b last:border-0">
                        {row.slice(0, 6).map((cell: string, cellIndex: number) => (
                          <td key={`preview-${rowIndex}-${cellIndex}`} className="max-w-48 truncate px-3 py-2">
                            {cell || '–'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={() => preview && handleImport(preview)} disabled={!preview?.validRows}>
              <Upload className="size-4" aria-hidden />
              {t('exchange.import')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
