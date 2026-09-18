import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';
import type { Language } from '@/lib/i18n/dictionary';

export interface CleaningSignatureEntry {
  date: string;
  time: string;
  status: string;
}

export interface CleaningSignatureSheet {
  title: string;
  building: string;
  room: string;
  area: string;
  cleaner: string;
  entries: CleaningSignatureEntry[];
}

export interface CleaningSignatureLabels {
  title: string;
  day: string;
  time: string;
  visa: string;
  cleaner: string;
  building: string;
  room: string;
  area: string;
  signature: string;
  checkedBy: string;
  language: Language;
}

export interface CleaningSignatureBranding {
  companyName: string;
  companyAddress: string;
  logo: string;
}

const WIDTH = 297;
const HEIGHT = 210;
const MARGIN = 12;
const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const LINE: [number, number, number] = [180, 188, 198];

const monthName = (date: Date, language: Language): string =>
  new Intl.DateTimeFormat(language === 'de' ? 'de-CH' : language, {
    month: 'long',
    year: '2-digit',
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

const footer = (doc: jsPDF, branding: CleaningSignatureBranding): void => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(branding.companyName || 'Facility365', MARGIN, HEIGHT - 6);
  doc.text('Facility365', WIDTH - MARGIN, HEIGHT - 6, { align: 'right' });
};

const drawMonthTable = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  month: Date,
  rows: Map<string, CleaningSignatureEntry>,
  labels: CleaningSignatureLabels,
): void => {
  const headerHeight = 7;
  const rowHeight = 4.35;
  const dayWidth = 15;
  const timeWidth = 34;
  const visaWidth = width - dayWidth - timeWidth;
  const totalRows = daysInMonth(month);

  doc.setFillColor(...INK);
  doc.rect(x, y, width, headerHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(monthName(month, labels.language), x + width / 2, y + 6, { align: 'center' });

  const tableY = y + headerHeight;
  doc.setFillColor(242, 245, 248);
  doc.rect(x, tableY, width, 8, 'F');
  doc.setDrawColor(...LINE);
  doc.rect(x, tableY, width, 7 + totalRows * rowHeight);
  doc.line(x + dayWidth, tableY, x + dayWidth, tableY + 7 + totalRows * rowHeight);
  doc.line(x + dayWidth + timeWidth, tableY, x + dayWidth + timeWidth, tableY + 7 + totalRows * rowHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(labels.day, x + 2, tableY + 5);
  doc.text(labels.time, x + dayWidth + 2, tableY + 5);
  doc.text(labels.visa, x + dayWidth + timeWidth + 2, tableY + 5);

  for (let day = 1; day <= totalRows; day += 1) {
    const rowY = tableY + 7 + (day - 1) * rowHeight;
    const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
    const entry = rows.get(key);
    doc.line(x, rowY, x + width, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(String(day), x + 2, rowY + 3.7);
    doc.text(entry?.time || '', x + dayWidth + 2, rowY + 3.7);
    if (entry?.status === 'done') {
      doc.setFont('helvetica', 'bold');
      doc.text('✓', x + dayWidth + timeWidth + 3, rowY + 3.7);
    }
  }
};

export const buildCleaningSignaturePdf = (
  sheet: CleaningSignatureSheet,
  labels: CleaningSignatureLabels,
  branding: CleaningSignatureBranding,
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const firstMonth = monthStart(0);
  const secondMonth = monthStart(1);
  const entries = new Map(sheet.entries.map((entry) => [entry.date, entry]));

  if (branding.logo) {
    drawLogo(doc, branding.logo, { x: MARGIN, y: 8, width: 24, height: 13 });
  }
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`${labels.title}: ${sheet.title || labels.area}`, MARGIN + 30, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    [
      branding.companyName,
      branding.companyAddress,
      [labels.building, sheet.building].filter(Boolean).join(': '),
      [labels.room, sheet.room].filter(Boolean).join(': '),
      [labels.area, sheet.area].filter(Boolean).join(': '),
      [labels.cleaner, sheet.cleaner].filter(Boolean).join(': '),
    ].filter(Boolean).join(' · '),
    MARGIN + 30,
    21,
  );

  const gap = 8;
  const tableWidth = (WIDTH - MARGIN * 2 - gap) / 2;
  drawMonthTable(doc, MARGIN, 28, tableWidth, firstMonth, entries, labels);
  drawMonthTable(doc, MARGIN + tableWidth + gap, 28, tableWidth, secondMonth, entries, labels);

  const signatureY = HEIGHT - 17;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...INK);
  doc.text(`${labels.signature}: ______________________________`, MARGIN, signatureY);
  doc.text(`${labels.checkedBy}: ______________________________`, WIDTH / 2, signatureY);
  footer(doc, branding);
  return doc;
};

export const downloadCleaningSignaturePdf = (
  sheet: CleaningSignatureSheet,
  labels: CleaningSignatureLabels,
  branding: CleaningSignatureBranding,
): void => {
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const viewer = mobile ? window.open('about:blank', '_blank') : null;
  const doc = buildCleaningSignaturePdf(sheet, labels, branding);
  const url = URL.createObjectURL(doc.output('blob'));
  const filename = `facility365-reinigung-unterschriftenliste-${sheet.title || 'liste'}.pdf`
    .replace(/[^\w-]+/g, '-')
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
