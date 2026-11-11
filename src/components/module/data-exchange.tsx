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
import * as XLSX from 'xlsx';

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
import { dictionary } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { parseCsv } from '@/lib/integrations/csv';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { FieldDef, FormValues, asNumber, asString, isAddressValue } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { BaseEntity, CollectionKey } from '@/lib/types';
import { newId } from '@/lib/utils/id';

interface ImportPreview {
  rows: string[][];
  columns: { field: FieldDef; index: number }[];
  checklistIndex: number;
  numberIndex: number;
  fileName: string;
  validRows: number;
  duplicateRows: number;
  emptyRows: number;
  /** Erkannte Zuordnung: Kopfzeile -> Feldbezeichnung (fuer die Vorschau). */
  mapping: string[];
}

/** Felder, die sich als eine Spalte abbilden lassen. */
const exportable = (field: FieldDef): boolean => field.kind !== 'address';

/** Schreibweisen fuer den Vergleich angleichen (Umlaute, Akzente, Satzzeichen weg). */
const norm = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');

/** Alle bekannten Bezeichnungen eines Feldes: Feldname + Label in vier Sprachen. */
const labelsOf = (field: FieldDef): string[] => {
  const entry = dictionary[field.labelKey];
  return [field.name, entry.de, entry.fr, entry.it, entry.en].map(norm);
};

/** Kopfzeile gegen alle Sprachvarianten pruefen: exakt 100, enthalten 60. */
const headerScore = (field: FieldDef, headerCell: string): number => {
  const cell = norm(headerCell);
  if (!cell) return 0;
  const labels = labelsOf(field);
  if (labels.some((label) => label === cell)) return 100;
  if (labels.some((label) => label.length >= 3 && (cell.includes(label) || label.includes(cell)))) return 60;
  return 0;
};

const DATE_RE = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$|^\d{4}-\d{2}-\d{2}/;
const MONTH_RE = /^\d{1,2}[.\-/]\d{4}$|^\d{4}-\d{2}$/;
const NUMBER_RE = /^-?[\d'’.,\s%]+$/;
const SWITCH_WORDS = ['1', '0', 'ja', 'nein', 'yes', 'no', 'oui', 'non', 'si', 'true', 'false', 'wahr', 'x'];
const TEL_RE = /^[+0-9 ()\-/]{6,}$/;

type Signature =
  | 'date'
  | 'month'
  | 'number'
  | 'switch'
  | 'email'
  | 'tel'
  | { relation: FieldDef }
  | { select: FieldDef };

/** Aus den Zellinhalten einer Spalte den Feldtyp erraten. */
const signatureOf = (
  cells: string[],
  fields: FieldDef[],
  collections: Record<CollectionKey, BaseEntity[]>,
  t: ReturnType<typeof useT>,
): Signature | null => {
  const sample = cells.map((cell) => cell.trim()).filter(Boolean).slice(0, 30);
  if (sample.length === 0) return null;
  const hits = (test: (cell: string) => boolean) =>
    sample.filter(test).length / sample.length;

  if (hits((cell) => cell.includes('@') && cell.includes('.')) >= 0.6) return 'email';
  if (hits((cell) => SWITCH_WORDS.includes(cell.toLowerCase())) >= 0.8) return 'switch';
  if (hits((cell) => DATE_RE.test(cell)) >= 0.6) return 'date';
  if (hits((cell) => MONTH_RE.test(cell)) >= 0.6) return 'month';

  /** Relation: Spaltenwerte stimmen mit Titeln oder Nummern der Ziel-Collection ueberein. */
  const relationRates = fields
    .filter((field) => field.kind === 'relation')
    .map((field) => {
      const targets = field.kind === 'relation' ? collections[field.collection] ?? [] : [];
      const rate =
        targets.length === 0
          ? 0
          : hits((cell) =>
              targets.some(
                (item) =>
                  field.kind === 'relation' &&
                  (norm(titleOfEntity(field.collection, item)) === norm(cell) ||
                    norm(item.number) === norm(cell)),
              ),
            );
      return { field, rate };
    })
    .sort((a, b) => b.rate - a.rate);
  if (relationRates[0] && relationRates[0].rate >= 0.6) {
    return { relation: relationRates[0].field };
  }

  /** Auswahlfeld: Werte entsprechen den bekannten Optionen. */
  const selectRates = fields
    .filter((field) => field.kind === 'select')
    .map((field) => ({
      field,
      rate: hits((cell) =>
        field.kind === 'select'
          ? field.options.some(
              (option) =>
                norm(option.value) === norm(cell) || norm(t(option.labelKey)) === norm(cell),
            )
          : false,
      ),
    }))
    .sort((a, b) => b.rate - a.rate);
  if (selectRates[0] && selectRates[0].rate >= 0.6) {
    return { select: selectRates[0].field };
  }

  if (hits((cell) => NUMBER_RE.test(cell) && /\d/.test(cell)) >= 0.7) return 'number';
  if (hits((cell) => TEL_RE.test(cell)) >= 0.7) return 'tel';
  return null;
};

/** Wie gut passt der erkannte Inhalt auf dieses Feld? */
const contentScore = (field: FieldDef, signature: Signature | null): number => {
  if (!signature) {
    if (field.required) return 45;
    if (['name', 'title', 'description', 'notes', 'remark', 'text'].includes(field.name)) return 35;
    return field.kind === 'text' || field.kind === 'textarea' || field.kind === 'suggest' ? 15 : 0;
  }
  if (typeof signature === 'object') {
    if ('relation' in signature) return field === signature.relation ? 90 : 0;
    return field === signature.select ? 85 : 0;
  }
  switch (signature) {
    case 'date':
      return field.kind === 'date' ? 80 : field.kind === 'month' ? 60 : 0;
    case 'month':
      return field.kind === 'month' ? 80 : field.kind === 'date' ? 50 : 0;
    case 'switch':
      return field.kind === 'switch' ? 80 : 0;
    case 'email':
      return field.kind === 'email' ? 80 : 0;
    case 'tel':
      return field.kind === 'tel' ? 80 : 0;
    case 'number':
      return field.kind === 'number' || field.kind === 'money' ? 70 : 0;
    default:
      return 0;
  }
};

/**
 * Spalten den Feldern zuordnen. Zuerst Kopfzeilen (alle Sprachen, unscharf),
 * danach erkannte Inhalte; jede Spalte und jedes Feld hoechstens einmal.
 */
const matchColumns = (
  rows: string[][],
  fields: FieldDef[],
  collections: Record<CollectionKey, BaseEntity[]>,
  t: ReturnType<typeof useT>,
  skip: Set<number>,
): { field: FieldDef; index: number }[] => {
  const header = rows[0] ?? [];
  const candidates: { score: number; field: FieldDef; index: number }[] = [];
  for (let index = 0; index < header.length; index += 1) {
    if (skip.has(index)) continue;
    const cells = rows.slice(1).map((row) => row[index] ?? '');
    const signature = signatureOf(cells, fields, collections, t);
    fields.forEach((field) => {
      const score = Math.max(
        headerScore(field, header[index] ?? ''),
        contentScore(field, signature),
      );
      if (score > 0) candidates.push({ score, field, index });
    });
  }
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const usedFields = new Set<FieldDef>();
  const usedColumns = new Set<number>();
  const result: { field: FieldDef; index: number }[] = [];
  candidates.forEach(({ field, index }) => {
    if (usedFields.has(field) || usedColumns.has(index)) return;
    usedFields.add(field);
    usedColumns.add(index);
    result.push({ field, index });
  });
  return result;
};

/** Spaltenwert in einen Feldwert wandeln; unbekannte Angaben bleiben leer. */

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
  /** Schreibweisen wie 14.09.2026 oder 09.2026 in das ISO-Format der App wandeln. */
  if (field.kind === 'date' || field.kind === 'month') {
    const pad = (value: string) => value.padStart(2, '0');
    const day = text.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
    if (day) {
      const year = day[3].length === 2 ? `20${day[3]}` : day[3];
      return field.kind === 'date'
        ? `${year}-${pad(day[2])}-${pad(day[1])}`
        : `${year}-${pad(day[2])}`;
    }
    const month = text.match(/^(\d{1,2})[.\-/](\d{4})$/);
    if (month && field.kind === 'month') return `${month[2]}-${pad(month[1])}`;
    return text;
  }
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
    const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, collection);
    XLSX.writeFile(workbook, `${collection}.xlsx`);
    toast.success(t('exchange.exported'));
  };

  const prepareImport = async (file: File) => {
    let rows: string[][];
    if (/\.xlsx?$/i.test(file.name)) {
      const workbook = XLSX.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = sheet
        ? (XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '', raw: false }) as string[][])
            .map((row) => row.map((cell) => String(cell ?? '')))
            .filter((row) => row.some((cell) => cell.trim() !== ''))
        : [];
    } else {
      rows = parseCsv(await file.text());
    }
    const header = rows[0]?.map((cell) => cell.trim().toLowerCase()) ?? [];
    /** Nummernspalte erkennen (fuer die Duplikatpruefung); fehlt sie, zaehlt Spalte 1 normal mit. */
    const numberIndex = (rows[0] ?? []).findIndex((cell) =>
      ['nummer', 'number', 'nr', 'no', 'numero', 'num', 'code', 'id'].includes(norm(cell)),
    );
    const skip = new Set<number>();
    if (numberIndex >= 0) skip.add(numberIndex);
    /** Spalten den Feldern zuordnen: Kopfzeile (4 Sprachen) und Inhalt. */
    const columns = matchColumns(rows, fields, collections, t, skip);

    if (columns.length === 0) {
      toast.error(t('exchange.noColumns'));
      return;
    }

    const existingNumbers = new Set(items.map((item) => item.number.trim().toLowerCase()));
    let duplicateRows = 0;
    let emptyRows = 0;
    let validRows = 0;
    rows.slice(1).forEach((row) => {
      const importedNumber = numberIndex >= 0 ? (row[numberIndex] ?? '').trim().toLowerCase() : '';
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
      numberIndex,
      fileName: file.name,
      validRows,
      duplicateRows,
      emptyRows,
      mapping: columns
        .sort((a, b) => a.index - b.index)
        .map(({ field, index }) => `${rows[0]?.[index] ?? ''} → ${t(field.labelKey)}`),
    });
  };

  const handleImport = (next: ImportPreview) => {
    let created = 0;
    const existingNumbers = new Set(items.map((item) => item.number.trim().toLowerCase()));
    next.rows.slice(1).forEach((row) => {
      const importedNumber =
        next.numberIndex >= 0 ? (row[next.numberIndex] ?? '').trim().toLowerCase() : '';
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
            accept=".csv,.xlsx,.xls,text/csv"
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
              {preview.mapping.length > 0 ? (
                <div className="rounded-lg border bg-card p-3">
                  <p className="mb-1 text-xs text-muted-foreground">{t('exchange.mapping')}</p>
                  <ul className="flex flex-col gap-0.5 text-xs">
                    {preview.mapping.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
