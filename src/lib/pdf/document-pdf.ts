/**
 * Einheitliches A4-Dokument fuer Auftraege, Kontrollprotokolle und weitere
 * Datensaetze.
 *
 * Gleicher Aufbau wie Rapport und Rechnung: Kopf mit Logo, Titel, Nummer und
 * Datum, danach Angaben, Text, Tabellen, Checklisten, Fotos und Unterschrift;
 * in der Fusszeile Firma, Erstellungsdatum und Seitenzahl.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';

export interface PdfPair {
  label: string;
  value: string;
}

export type PdfSection =
  | { kind: 'pairs'; title: string; pairs: PdfPair[] }
  | { kind: 'text'; title: string; text: string }
  | { kind: 'table'; title: string; head: string[]; rows: string[][] }
  | { kind: 'checklist'; title: string; items: { text: string; done: boolean }[] }
  | { kind: 'photos'; title: string; photos: { url: string; caption: string }[] }
  | { kind: 'signature'; title: string; image: string; caption: string; empty: string };

export interface DocumentPdfData {
  /** Dokumentart, z. B. „Auftrag“ oder „Kontrollprotokoll“. */
  kind: string;
  title: string;
  number: string;
  date: string;
  status: string;
  sections: PdfSection[];
}

export interface DocumentPdfBranding {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  logo: string;
  /** „Erstellt am“ in der Sprache der App. */
  createdLabel: string;
  pageLabel: string;
  createdAt: string;
}

const WIDTH = 210;
const HEIGHT = 297;
const MARGIN = 16;
const CONTENT = WIDTH - 2 * MARGIN;
const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const ACCENT: [number, number, number] = [14, 50, 85];
const LINE: [number, number, number] = [226, 232, 240];
const ZEBRA: [number, number, number] = [246, 248, 251];

const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed <= HEIGHT - MARGIN - 8) return y;
  doc.addPage();
  return MARGIN;
};

const drawHeader = (doc: jsPDF, data: DocumentPdfData, branding: DocumentPdfBranding): number => {
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: MARGIN, y: MARGIN, width: 34, height: 18 })
    : 0;
  if (logoHeight === 0) {
    doc.setFillColor(...ACCENT);
    doc.roundedRect(MARGIN, MARGIN, 12, 12, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('F3', MARGIN + 6, MARGIN + 7.8, { align: 'center' });
    doc.setTextColor(...INK);
    doc.setFontSize(13);
    doc.text('Facility365', MARGIN + 15, MARGIN + 5);
  }
  const textX = logoHeight > 0 ? MARGIN : MARGIN + 15;
  const textY = logoHeight > 0 ? MARGIN + logoHeight + 5 : MARGIN + 5;
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
  doc.text(data.kind, WIDTH - MARGIN, MARGIN + 6, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(data.number || '', WIDTH - MARGIN, MARGIN + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(data.date || '', WIDTH - MARGIN, MARGIN + 17.5, { align: 'right' });
  if (data.status) doc.text(data.status, WIDTH - MARGIN, MARGIN + 22, { align: 'right' });

  let y = Math.max(MARGIN + 27, textY + 4.5 + brandLines.length * 4 + 4);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  const title: string[] = doc.splitTextToSize(data.title || '–', CONTENT);
  doc.text(title.slice(0, 2), MARGIN, y);
  return y + Math.min(title.length, 2) * 6 + 4;
};

const sectionTitle = (doc: jsPDF, title: string, y: number): number => {
  const cursor = ensureSpace(doc, y, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), MARGIN, cursor);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor + 1.8, WIDTH - MARGIN, cursor + 1.8);
  return cursor + 7;
};

const drawPairs = (doc: jsPDF, pairs: PdfPair[], y: number): number => {
  const half = (CONTENT - 8) / 2;
  let cursor = y;
  for (let index = 0; index < pairs.length; index += 2) {
    const row = pairs.slice(index, index + 2);
    const heights = row.map((pair) => {
      doc.setFontSize(9.5);
      const lines: string[] = doc.splitTextToSize(pair.value || '–', half);
      return Math.min(lines.length, 4);
    });
    const needed = 6 + Math.max(...heights) * 4.4;
    cursor = ensureSpace(doc, cursor, needed);
    row.forEach((pair, column) => {
      const x = MARGIN + column * (half + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(pair.label.toUpperCase(), x, cursor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...INK);
      const lines: string[] = doc.splitTextToSize(pair.value || '–', half);
      doc.text(lines.slice(0, 4), x, cursor + 4.2);
    });
    cursor += needed + 1;
  }
  return cursor + 2;
};

const drawText = (doc: jsPDF, text: string, y: number): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  let cursor = y;
  (doc.splitTextToSize(text || '–', CONTENT) as string[]).forEach((line) => {
    cursor = ensureSpace(doc, cursor, 5);
    doc.text(line, MARGIN, cursor);
    cursor += 4.8;
  });
  return cursor + 3;
};

const drawTable = (doc: jsPDF, head: string[], rows: string[][], y: number): number => {
  const width = CONTENT / Math.max(head.length, 1);
  const headRow = (start: number) => {
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, start - 4.2, CONTENT, 6.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    head.forEach((cell, index) => doc.text(cell, MARGIN + 2 + index * width, start));
    return start + 6.5;
  };
  let cursor = headRow(ensureSpace(doc, y, 14));
  rows.forEach((row, rowIndex) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const cells = row.map((cell) => (doc.splitTextToSize(cell || '–', width - 4) as string[]).slice(0, 3));
    const height = Math.max(...cells.map((cell) => cell.length), 1) * 4 + 2;
    if (cursor + height > HEIGHT - MARGIN - 8) {
      doc.addPage();
      cursor = headRow(MARGIN + 4);
    }
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...ZEBRA);
      doc.rect(MARGIN, cursor - 4, CONTENT, height, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    cells.forEach((cell, index) => doc.text(cell, MARGIN + 2 + index * width, cursor));
    cursor += height;
  });
  return cursor + 4;
};

const drawChecklist = (
  doc: jsPDF,
  items: { text: string; done: boolean }[],
  y: number,
): number => {
  let cursor = y;
  items.forEach((item) => {
    const lines: string[] = doc.splitTextToSize(item.text || '–', CONTENT - 8);
    cursor = ensureSpace(doc, cursor, lines.length * 4.6 + 2);
    doc.setDrawColor(...MUTED);
    doc.rect(MARGIN, cursor - 3, 3.4, 3.4);
    if (item.done) {
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.6);
      doc.line(MARGIN + 0.6, cursor - 1.3, MARGIN + 1.5, cursor - 0.2);
      doc.line(MARGIN + 1.5, cursor - 0.2, MARGIN + 3, cursor - 2.6);
      doc.setLineWidth(0.2);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(lines, MARGIN + 6, cursor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    if (item.done) {
      doc.setTextColor(...ACCENT);
      doc.text('Ja', MARGIN + CONTENT, cursor, { align: 'right' });
    } else {
      doc.setTextColor(...MUTED);
      doc.text('–', MARGIN + CONTENT, cursor, { align: 'right' });
    }
    cursor += lines.length * 4.6 + 1.4;
  });
  return cursor + 3;
};

const drawPhotos = (doc: jsPDF, photos: { url: string; caption: string }[], y: number): number => {
  const columns = 3;
  const gap = 4;
  const size = (CONTENT - gap * (columns - 1)) / columns;
  const height = size * 0.75;
  let cursor = y;
  photos.slice(0, 12).forEach((photo, index) => {
    const column = index % columns;
    if (column === 0) cursor = ensureSpace(doc, cursor, height + 8);
    const x = MARGIN + column * (size + gap);
    try {
      doc.addImage(photo.url, x, cursor, size, height, undefined, 'FAST');
    } catch {
      doc.setDrawColor(...LINE);
      doc.rect(x, cursor, size, height);
    }
    if (photo.caption) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text((doc.splitTextToSize(photo.caption, size) as string[])[0] ?? '', x, cursor + height + 3.2);
    }
    if (column === columns - 1) cursor += height + 8;
  });
  if (Math.min(photos.length, 12) % columns !== 0) cursor += height + 8;
  return cursor + 2;
};

const drawSignature = (doc: jsPDF, image: string, caption: string, empty: string, y: number): number => {
  const cursor = ensureSpace(doc, y, 44);
  const boxWidth = 84;
  const boxHeight = 30;
  if (image) {
    try {
      doc.addImage(image, 'PNG', MARGIN, cursor, boxWidth, boxHeight, undefined, 'FAST');
    } catch {
      /* Eine unlesbare Unterschrift darf das Dokument nicht verhindern. */
    }
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(empty, MARGIN, cursor + boxHeight / 2);
  }
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor + boxHeight + 1, MARGIN + boxWidth, cursor + boxHeight + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  if (caption) doc.text(caption, MARGIN, cursor + boxHeight + 6);
  return cursor + boxHeight + 12;
};

const drawFooters = (doc: jsPDF, data: DocumentPdfData, branding: DocumentPdfBranding) => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.line(MARGIN, HEIGHT - 14, WIDTH - MARGIN, HEIGHT - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      [branding.companyName || 'Facility365', data.number].filter(Boolean).join(' · '),
      MARGIN,
      HEIGHT - 10,
    );
    doc.text(`${branding.createdLabel} ${branding.createdAt}`, WIDTH / 2, HEIGHT - 10, {
      align: 'center',
    });
    doc.text(`${branding.pageLabel} ${page}/${pages}`, WIDTH - MARGIN, HEIGHT - 10, {
      align: 'right',
    });
  }
};

export const buildDocumentPdf = (data: DocumentPdfData, branding: DocumentPdfBranding): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title: `${data.kind} ${data.number}`.trim(), creator: 'Facility365' });
  let y = drawHeader(doc, data, branding);
  data.sections.forEach((section) => {
    y = sectionTitle(doc, section.title, y);
    switch (section.kind) {
      case 'pairs':
        y = drawPairs(doc, section.pairs, y);
        break;
      case 'text':
        y = drawText(doc, section.text, y);
        break;
      case 'table':
        y = drawTable(doc, section.head, section.rows, y);
        break;
      case 'checklist':
        y = drawChecklist(doc, section.items, y);
        break;
      case 'photos':
        y = drawPhotos(doc, section.photos, y);
        break;
      case 'signature':
        y = drawSignature(doc, section.image, section.caption, section.empty, y);
        break;
    }
    y += 2;
  });
  drawFooters(doc, data, branding);
  return doc;
};

export const documentPdfFileName = (data: DocumentPdfData): string =>
  `${data.kind}-${data.number || 'Dokument'}.pdf`.replace(/[^\p{L}\p{N}._-]+/gu, '-');
