/**
 * Berichte als PDF im Format A4.
 *
 * Kopf mit Marke, Standort und Zeitraum, danach je Bereich eine Tabelle mit
 * Ampel, Nummer, Bezeichnung, Datum und Status. Dient dem Auditbericht und
 * dem Uebergabebericht.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';

export interface AuditPdfRow {
  tone: 'green' | 'amber' | 'red';
  number: string;
  title: string;
  date: string;
  status: string;
  detail: string;
}

export interface AuditPdfSection {
  title: string;
  rows: AuditPdfRow[];
}

/** Kennzahl im Kopf eines Berichts. */
export interface AuditPdfMetric {
  label: string;
  value: string;
}

/** Freie Tabelle, z. B. Vergleich nach Liegenschaft. */
export interface AuditPdfTable {
  title: string;
  head: string[];
  rows: string[][];
}

export interface AuditPdfData {
  location: string;
  period: string;
  createdAt: string;
  sections: AuditPdfSection[];
  green: number;
  amber: number;
  red: number;
  /** Ampeluebersicht zeigen; ohne Angabe wird sie gezeigt. */
  showSummary?: boolean;
  /** Zusaetzliche Kopfzeilen, z. B. uebergebende und uebernehmende Person. */
  infoLines?: string[];
  /** Abschliessender Textblock, z. B. Besonderheiten. */
  notes?: { title: string; text: string };
  /** Anfang des Dateinamens; ohne Angabe «Auditbericht». */
  fileBaseName?: string;
  /** Kennzahlen vor den Bereichen. */
  metrics?: AuditPdfMetric[];
  /** Tabellen nach den Bereichen. */
  tables?: AuditPdfTable[];
}

export interface AuditPdfLabels {
  title: string;
  location: string;
  period: string;
  createdAt: string;
  summary: string;
  green: string;
  amber: string;
  red: string;
  number: string;
  subject: string;
  date: string;
  status: string;
  empty: string;
}

export interface AuditPdfBranding {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  logo: string;
}

const WIDTH = 210;
const HEIGHT = 297;
const MARGIN = 16;
const CONTENT = WIDTH - 2 * MARGIN;
const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const ACCENT: [number, number, number] = [14, 50, 85];
const LINE: [number, number, number] = [226, 232, 240];

const TONE_COLORS: Record<AuditPdfRow['tone'], [number, number, number]> = {
  green: [22, 163, 74],
  amber: [217, 119, 6],
  red: [220, 38, 38],
};

const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed <= HEIGHT - MARGIN - 6) return y;
  doc.addPage();
  return MARGIN;
};

const drawHeader = (doc: jsPDF, data: AuditPdfData, labels: AuditPdfLabels, branding: AuditPdfBranding): number => {
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: MARGIN, y: MARGIN, width: 34, height: 18 })
    : 0;

  const textX = MARGIN;
  const textY = logoHeight > 0 ? MARGIN + logoHeight + 5 : MARGIN + 5;
  if (logoHeight === 0) {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Facility365', textX, textY);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const brandLines = [branding.companyName, branding.companyAddress, branding.companyContact]
    .filter((line) => line && line !== 'Facility365')
    .slice(0, 3);
  brandLines.forEach((line, index) => doc.text(line, textX, textY + 4.5 + index * 4));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(labels.title, WIDTH - MARGIN, MARGIN + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${labels.location}: ${data.location}`, WIDTH - MARGIN, MARGIN + 12.5, { align: 'right' });
  doc.text(`${labels.period}: ${data.period}`, WIDTH - MARGIN, MARGIN + 17, { align: 'right' });
  doc.text(`${labels.createdAt}: ${data.createdAt}`, WIDTH - MARGIN, MARGIN + 21.5, { align: 'right' });
  const infoLines = data.infoLines ?? [];
  infoLines.forEach((line, index) =>
    doc.text(line, WIDTH - MARGIN, MARGIN + 26 + index * 4.5, { align: 'right' }),
  );

  const y = Math.max(
    MARGIN + 26 + infoLines.length * 4.5,
    textY + 4.5 + brandLines.length * 4 + 4,
  );
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);
  return y + 8;
};

const drawSummary = (doc: jsPDF, data: AuditPdfData, labels: AuditPdfLabels, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(labels.summary.toUpperCase(), MARGIN, y);
  let cursor = y + 6;

  const entries: [AuditPdfRow['tone'], string, number][] = [
    ['green', labels.green, data.green],
    ['amber', labels.amber, data.amber],
    ['red', labels.red, data.red],
  ];
  entries.forEach(([tone, label, count], index) => {
    const x = MARGIN + index * (CONTENT / 3);
    doc.setFillColor(...TONE_COLORS[tone]);
    doc.circle(x + 2, cursor - 1.4, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(String(count), x + 7, cursor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(label, x + 14, cursor);
  });
  cursor += 8;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  return cursor + 8;
};

const drawSection = (doc: jsPDF, section: AuditPdfSection, labels: AuditPdfLabels, y: number): number => {
  let cursor = ensureSpace(doc, y, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(`${section.title.toUpperCase()} (${section.rows.length})`, MARGIN, cursor);
  cursor += 5;

  if (section.rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(labels.empty, MARGIN, cursor + 1);
    return cursor + 9;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(labels.number, MARGIN + 6, cursor);
  doc.text(labels.subject, MARGIN + 28, cursor);
  doc.text(labels.date, MARGIN + 118, cursor);
  doc.text(labels.status, MARGIN + 145, cursor);
  cursor += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  cursor += 5;

  section.rows.forEach((row) => {
    cursor = ensureSpace(doc, cursor, 8);
    doc.setFillColor(...TONE_COLORS[row.tone]);
    doc.circle(MARGIN + 1.6, cursor - 1.3, 1.6, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(row.number, MARGIN + 6, cursor);
    const title: string = doc.splitTextToSize(row.title, 86)[0] ?? '';
    doc.text(title, MARGIN + 28, cursor);
    doc.text(row.date || '–', MARGIN + 118, cursor);
    const status: string = doc.splitTextToSize(row.status, 33)[0] ?? '';
    doc.text(status, MARGIN + 145, cursor);
    cursor += 5.6;
  });

  return cursor + 5;
};

const drawMetrics = (doc: jsPDF, metrics: AuditPdfMetric[], title: string, y: number): number => {
  let cursor = ensureSpace(doc, y, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), MARGIN, cursor);
  cursor += 7;

  const columns = 4;
  const width = CONTENT / columns;
  metrics.forEach((metric, index) => {
    const column = index % columns;
    if (column === 0 && index > 0) cursor = ensureSpace(doc, cursor + 12, 12);
    const x = MARGIN + column * width;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(metric.value, x, cursor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const label: string = doc.splitTextToSize(metric.label, width - 3)[0] ?? '';
    doc.text(label, x, cursor + 4);
  });
  cursor += 10;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  return cursor + 8;
};

const drawTable = (doc: jsPDF, table: AuditPdfTable, empty: string, y: number): number => {
  let cursor = ensureSpace(doc, y, 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(table.title.toUpperCase(), MARGIN, cursor);
  cursor += 5;

  if (table.rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(empty, MARGIN, cursor + 1);
    return cursor + 9;
  }

  const first = 58;
  const rest = table.head.length > 1 ? (CONTENT - first) / (table.head.length - 1) : 0;
  const columnX = (index: number): number => (index === 0 ? MARGIN : MARGIN + first + index * rest - rest);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  table.head.forEach((cell, index) =>
    doc.text(cell, columnX(index) + (index === 0 ? 0 : rest - 2), cursor, {
      align: index === 0 ? 'left' : 'right',
    }),
  );
  cursor += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  cursor += 5;

  table.rows.forEach((row) => {
    cursor = ensureSpace(doc, cursor, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    row.forEach((cell, index) => {
      const text: string = doc.splitTextToSize(cell, index === 0 ? first - 2 : rest - 2)[0] ?? '';
      doc.text(text, columnX(index) + (index === 0 ? 0 : rest - 2), cursor, {
        align: index === 0 ? 'left' : 'right',
      });
    });
    cursor += 5.6;
  });

  return cursor + 5;
};

const drawNotes = (doc: jsPDF, notes: { title: string; text: string }, y: number): number => {
  let cursor = ensureSpace(doc, y, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(notes.title.toUpperCase(), MARGIN, cursor);
  cursor += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  const lines: string[] = doc.splitTextToSize(notes.text || '–', CONTENT);
  lines.forEach((line) => {
    cursor = ensureSpace(doc, cursor, 8);
    doc.text(line, MARGIN, cursor);
    cursor += 5;
  });
  return cursor + 4;
};

const drawFooters = (doc: jsPDF, labels: AuditPdfLabels): void => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Facility365 · ${labels.title}`, MARGIN, HEIGHT - 10);
    doc.text(`${page}/${pages}`, WIDTH - MARGIN, HEIGHT - 10, { align: 'right' });
  }
};

export const buildAuditPdf = (
  data: AuditPdfData,
  labels: AuditPdfLabels,
  branding: AuditPdfBranding,
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = drawHeader(doc, data, labels, branding);
  if (data.showSummary !== false) y = drawSummary(doc, data, labels, y);
  if (data.metrics && data.metrics.length > 0) y = drawMetrics(doc, data.metrics, labels.summary, y);
  data.sections.forEach((section) => {
    y = drawSection(doc, section, labels, y);
  });
  (data.tables ?? []).forEach((table) => {
    y = drawTable(doc, table, labels.empty, y);
  });
  if (data.notes) y = drawNotes(doc, data.notes, y);
  drawFooters(doc, labels);
  return doc;
};

export const auditPdfFileName = (data: AuditPdfData): string =>
  `${data.fileBaseName ?? 'Auditbericht'}-${data.createdAt.replace(/[^0-9]/g, '') || 'aktuell'}.pdf`;

export const downloadAuditPdf = (
  data: AuditPdfData,
  labels: AuditPdfLabels,
  branding: AuditPdfBranding,
): void => {
  buildAuditPdf(data, labels, branding).save(auditPdfFileName(data));
};
