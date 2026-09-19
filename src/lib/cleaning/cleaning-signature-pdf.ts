/**
 * Kontrollblatt (Unterschriftenliste) einer Reinigung als PDF, A4 oder A3 quer.
 *
 * Zwei Monatsbloecke mit Tag, Zeit, Visum und Status; nur die gemaess Frequenz
 * geplanten Tage tragen eine Zeit, alle anderen Tage sind abgeschwaecht.
 * Darunter Bemerkungen, Kontrollperson und Unterschriften.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';
import type { Language } from '@/lib/i18n/dictionary';

export interface CleaningSignatureEntry {
  date: string;
  time: string;
  status: string;
  planned: boolean;
  executed: boolean;
}

export interface CleaningSignatureSheet {
  title: string;
  organization: string;
  location: string;
  property: string;
  building: string;
  room: string;
  area: string;
  areaType: string;
  interval: string;
  cleaner: string;
  inspector: string;
  version: string;
  entries: CleaningSignatureEntry[];
}

export interface CleaningSignatureLabels {
  title: string;
  day: string;
  planned: string;
  executed: string;
  time: string;
  visa: string;
  control: string;
  status: string;
  ok: string;
  rework: string;
  notDone: string;
  cleaner: string;
  inspector: string;
  property: string;
  building: string;
  room: string;
  area: string;
  areaType: string;
  interval: string;
  remarks: string;
  signature: string;
  checkedBy: string;
  date: string;
  version: string;
  reworkHint: string;
  language: Language;
}

export interface CleaningSignatureBranding {
  companyName: string;
  companyAddress: string;
  logo: string;
}

export type CleaningSheetFormat = 'a4' | 'a3';

const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const LINE: [number, number, number] = [180, 188, 198];
const SHADE: [number, number, number] = [236, 239, 243];

interface Layout {
  width: number;
  height: number;
  margin: number;
  rowHeight: number;
  scale: number;
}

const layoutFor = (format: CleaningSheetFormat): Layout =>
  format === 'a3'
    ? { width: 420, height: 297, margin: 16, rowHeight: 5.8, scale: 1.35 }
    : { width: 297, height: 210, margin: 12, rowHeight: 4.0, scale: 1 };

const monthName = (date: Date, language: Language): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-CH' : language, {
    month: 'long',
    year: 'numeric',
  }).format(date);

const monthStart = (offset: number): Date => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
};

const daysInMonth = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const dateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const weekday = (date: Date, language: Language): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-CH' : language, { weekday: 'short' })
    .format(date)
    .replace('.', '');

const checkbox = (
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  checked = false,
): void => {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.rect(x, y, size, size);
  if (checked) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size * 2.2);
    doc.text('×', x + size / 2, y + size * 0.82, { align: 'center' });
  }
  doc.setLineWidth(0.2);
};

const drawMonthTable = (
  doc: jsPDF,
  l: Layout,
  x: number,
  y: number,
  width: number,
  month: Date,
  rows: Map<string, CleaningSignatureEntry>,
  labels: CleaningSignatureLabels,
): number => {
  const headerHeight = 8 * l.scale;
  const columnHeader = 10 * l.scale;
  const dayWidth = 25 * l.scale;
  const plannedWidth = 20 * l.scale;
  const executedWidth = 22 * l.scale;
  const timeWidth = 24 * l.scale;
  const visaWidth = 22 * l.scale;
  const controlWidth = 25 * l.scale;
  const statusWidth = 40 * l.scale;
  const remarksWidth =
    width -
    dayWidth -
    plannedWidth -
    executedWidth -
    timeWidth -
    visaWidth -
    controlWidth -
    statusWidth;
  const totalRows = daysInMonth(month);
  const tableHeight = columnHeader + totalRows * l.rowHeight;

  doc.setFillColor(...INK);
  doc.rect(x, y, width, headerHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11 * l.scale);
  doc.setTextColor(255, 255, 255);
  doc.text(monthName(month, labels.language), x + width / 2, y + headerHeight - 2 * l.scale, {
    align: 'center',
  });

  const tableY = y + headerHeight;
  doc.setFillColor(242, 245, 248);
  doc.rect(x, tableY, width, columnHeader, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8 * l.scale);
  doc.setTextColor(...INK);
  const headY = tableY + columnHeader - 2.2 * l.scale;
  const headers: Array<[string, number, number]> = [
    [labels.day, x, dayWidth],
    [labels.planned, x + dayWidth, plannedWidth],
    [labels.executed, x + dayWidth + plannedWidth, executedWidth],
    [labels.time, x + dayWidth + plannedWidth + executedWidth, timeWidth],
    [labels.visa, x + dayWidth + plannedWidth + executedWidth + timeWidth, visaWidth],
    [
      labels.control,
      x + dayWidth + plannedWidth + executedWidth + timeWidth + visaWidth,
      controlWidth,
    ],
    [
      labels.remarks,
      x + dayWidth + plannedWidth + executedWidth + timeWidth + visaWidth + controlWidth,
      remarksWidth,
    ],
  ];
  headers.forEach(([label, cellX, cellWidth]) => {
    doc.setFontSize(6.5 * l.scale);
    const text: string = doc.splitTextToSize(label, cellWidth - 2)[0] ?? '';
    doc.text(text, cellX + cellWidth / 2, headY, { align: 'center' });
  });
  doc.setFontSize(6.5 * l.scale);
  const statusX =
    x +
    dayWidth +
    plannedWidth +
    executedWidth +
    timeWidth +
    visaWidth +
    controlWidth +
    remarksWidth;
  const third = statusWidth / 3;
  [labels.ok, labels.rework, labels.notDone].forEach((label, index) => {
    const text: string = doc.splitTextToSize(label, third - 1)[0] ?? '';
    doc.text(text, statusX + index * third + third / 2, headY, { align: 'center' });
  });

  const box = Math.min(l.rowHeight - 1.2, 4.4);
  for (let day = 1; day <= totalRows; day += 1) {
    const rowY = tableY + columnHeader + (day - 1) * l.rowHeight;
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const entry = rows.get(dateKey(date));
    if (!entry) {
      doc.setFillColor(...SHADE);
      doc.rect(x, rowY, width, l.rowHeight, 'F');
    }
    doc.setDrawColor(...LINE);
    doc.line(x, rowY, x + width, rowY);
    doc.setFont('helvetica', entry ? 'bold' : 'normal');
    doc.setFontSize(7.5 * l.scale);
    doc.setTextColor(...(entry ? INK : MUTED));
    const baseline = rowY + l.rowHeight - 1.1 * l.scale;
    doc.text(`${String(day).padStart(2, '0')} ${weekday(date, labels.language)}`, x + 2, baseline);
    checkbox(
      doc,
      x + dayWidth + plannedWidth / 2 - box / 2,
      rowY + (l.rowHeight - box) / 2,
      box,
      entry?.planned ?? false,
    );
    checkbox(
      doc,
      x + dayWidth + plannedWidth + executedWidth / 2 - box / 2,
      rowY + (l.rowHeight - box) / 2,
      box,
      entry?.executed ?? false,
    );
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(
      entry?.time || '',
      x + dayWidth + plannedWidth + executedWidth + 2,
      baseline,
    );
    doc.text(
      '',
      x + dayWidth + plannedWidth + executedWidth + timeWidth + visaWidth + controlWidth + 2,
      baseline,
    );
    if (entry) {
      for (let index = 0; index < 3; index += 1) {
        checkbox(doc, statusX + index * third + third / 2 - box / 2, rowY + (l.rowHeight - box) / 2, box);
      }
    }
  }

  doc.setDrawColor(...LINE);
  doc.rect(x, tableY, width, tableHeight);
  [
    dayWidth,
    dayWidth + plannedWidth,
    dayWidth + plannedWidth + executedWidth,
    dayWidth + plannedWidth + executedWidth + timeWidth,
    dayWidth + plannedWidth + executedWidth + timeWidth + visaWidth,
    dayWidth + plannedWidth + executedWidth + timeWidth + visaWidth + controlWidth,
    dayWidth +
      plannedWidth +
      executedWidth +
      timeWidth +
      visaWidth +
      controlWidth +
      remarksWidth,
  ].forEach((offset) => {
    doc.line(x + offset, tableY, x + offset, tableY + tableHeight);
  });
  return tableY + tableHeight;
};

const drawHeader = (
  doc: jsPDF,
  l: Layout,
  sheet: CleaningSignatureSheet,
  labels: CleaningSignatureLabels,
  branding: CleaningSignatureBranding,
): number => {
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: l.margin, y: l.margin - 4, width: 28 * l.scale, height: 13 * l.scale })
    : 0;
  const textX = l.margin + (logoHeight > 0 ? 32 * l.scale : 0);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15 * l.scale);
  doc.text(`${labels.title}: ${sheet.title || sheet.area || labels.area}`, textX, l.margin + 3 * l.scale);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5 * l.scale);
  doc.setTextColor(...MUTED);
  doc.text(
    [sheet.organization, sheet.location, branding.companyAddress].filter(Boolean).join(' · '),
    textX,
    l.margin + 8 * l.scale,
  );

  const pairs: [string, string][] = [
    [labels.property, sheet.property],
    [labels.building, sheet.building],
    [labels.room, [sheet.room, sheet.area].filter(Boolean).join(' · ')],
    [labels.areaType, sheet.areaType],
    [labels.interval, sheet.interval],
    [labels.cleaner, sheet.cleaner],
    [labels.inspector, sheet.inspector || '____________________'],
  ];
  const y = l.margin + 14 * l.scale;
  const colWidth = (l.width - 2 * l.margin) / pairs.length;
  pairs.forEach(([label, value], index) => {
    const x = l.margin + index * colWidth;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5 * l.scale);
    doc.setTextColor(...INK);
    const text: string = doc.splitTextToSize(value || '–', colWidth - 3)[0] ?? '–';
    doc.text(text, x, y + 4 * l.scale);
  });
  const end = y + 6.5 * l.scale;
  doc.setDrawColor(...LINE);
  doc.line(l.margin, end, l.width - l.margin, end);
  return end + 3 * l.scale;
};

export const buildCleaningSignaturePdf = (
  sheet: CleaningSignatureSheet,
  labels: CleaningSignatureLabels,
  branding: CleaningSignatureBranding,
  format: CleaningSheetFormat = 'a4',
): jsPDF => {
  const l = layoutFor(format);
  const doc = new jsPDF({ unit: 'mm', format, orientation: 'landscape' });
  const entries = new Map(sheet.entries.map((entry) => [entry.date, entry]));

  const gap = 8 * l.scale;
  const tableWidth = l.width - l.margin * 2;
  [monthStart(0), monthStart(1)].forEach((month, index) => {
    if (index > 0) doc.addPage();
    const top = drawHeader(doc, l, sheet, labels, branding);
    const tableEnd = drawMonthTable(doc, l, l.margin, top, tableWidth, month, entries, labels);
    const footerY = l.height - 6 * l.scale;
    const signatureY = footerY - 8 * l.scale;
    const remarksHeight = Math.max(signatureY - 8 * l.scale - tableEnd, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(labels.remarks.toUpperCase(), l.margin, tableEnd + 4 * l.scale);
    doc.setDrawColor(...LINE);
    doc.rect(l.margin, tableEnd + 5.5 * l.scale, tableWidth, remarksHeight);
    const half = (tableWidth - gap) / 2;
    doc.line(l.margin, signatureY, l.margin + half, signatureY);
    doc.line(l.margin + half + gap, signatureY, l.width - l.margin, signatureY);
    doc.setFontSize(7 * l.scale);
    doc.text(`${labels.signature} (${labels.cleaner})`, l.margin, signatureY + 3.2 * l.scale);
    doc.text(
      `${labels.checkedBy} (${labels.inspector})`,
      l.margin + half + gap,
      signatureY + 3.2 * l.scale,
    );
    doc.setFontSize(6.5 * l.scale);
    doc.text(labels.reworkHint, l.margin, footerY);
    doc.text(
      `${labels.date}: ${new Intl.DateTimeFormat(labels.language === 'de' ? 'de-CH' : labels.language).format(new Date())} · ${labels.version}: ${sheet.version} · ${index + 1}/2`,
      l.width - l.margin,
      footerY,
      { align: 'right' },
    );
  });
  return doc;
};

export const downloadCleaningSignaturePdf = (
  sheet: CleaningSignatureSheet,
  labels: CleaningSignatureLabels,
  branding: CleaningSignatureBranding,
  format: CleaningSheetFormat = 'a4',
): void => {
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const viewer = mobile ? window.open('about:blank', '_blank') : null;
  const doc = buildCleaningSignaturePdf(sheet, labels, branding, format);
  const url = URL.createObjectURL(doc.output('blob'));
  const filename = `facility365-reinigung-kontrollblatt-${sheet.title || 'liste'}-${format}.pdf`
    .replace(/[^\w.-]+/g, '-')
    .toLowerCase();

  if (mobile) {
    if (viewer) viewer.location.href = url;
    else window.location.assign(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};
