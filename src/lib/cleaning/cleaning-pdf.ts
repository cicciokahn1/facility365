/**
 * Reinigungsrapport als PDF im Format A4.
 *
 * Aufbau: Kopf mit Marke und Nummer, Ort und Zustaendigkeit, Arbeitszeit,
 * Checkliste, Material, Bemerkungen, Kontrollen und Fotos.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';

export interface CleaningPdfChecklistItem {
  text: string;
  done: boolean;
}

export interface CleaningPdfMaterial {
  name: string;
  quantity: number;
  unit: string;
}

export interface CleaningPdfCheck {
  date: string;
  inspector: string;
  result: string;
  measures: string;
}

export interface CleaningPdfPhoto {
  url: string;
  caption: string;
}

export interface CleaningPdfData {
  number: string;
  title: string;
  date: string;
  status: string;
  areaName: string;
  location: string;
  propertyName: string;
  buildingName: string;
  roomName: string;
  cleanerName: string;
  responsibleName: string;
  interval: string;
  workStart: string;
  workEnd: string;
  breakMinutes: number;
  workTotal: string;
  checklist: CleaningPdfChecklistItem[];
  materials: CleaningPdfMaterial[];
  remarks: string;
  checks: CleaningPdfCheck[];
  photos: CleaningPdfPhoto[];
}

export interface CleaningPdfLabels {
  report: string;
  date: string;
  status: string;
  area: string;
  place: string;
  cleaner: string;
  responsible: string;
  interval: string;
  workTime: string;
  start: string;
  end: string;
  breakLabel: string;
  total: string;
  checklist: string;
  material: string;
  quantity: string;
  remarks: string;
  checks: string;
  inspector: string;
  result: string;
  measures: string;
  photos: string;
  none: string;
}

export interface CleaningPdfBranding {
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

/** Neue Seite, sobald der Inhalt den Fussbereich erreicht. */
const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed <= HEIGHT - MARGIN - 6) return y;
  doc.addPage();
  return MARGIN;
};

const drawHeader = (
  doc: jsPDF,
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  branding: CleaningPdfBranding,
): number => {
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: MARGIN, y: MARGIN, width: 34, height: 18 })
    : 0;
  const textX = logoHeight > 0 ? MARGIN : MARGIN + 15;
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
  doc.text(labels.report, WIDTH - MARGIN, MARGIN + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(data.number, WIDTH - MARGIN, MARGIN + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${labels.date}: ${data.date || '–'}`, WIDTH - MARGIN, MARGIN + 17.5, { align: 'right' });
  doc.text(`${labels.status}: ${data.status}`, WIDTH - MARGIN, MARGIN + 22, { align: 'right' });

  const y = Math.max(MARGIN + 26, textY + 4.5 + brandLines.length * 4 + 4);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);
  return y + 8;
};

const drawSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), MARGIN, y);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, y + 1.8, WIDTH - MARGIN, y + 1.8);
  return y + 7;
};

const drawPair = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  const lines: string[] = doc.splitTextToSize(value || '–', width);
  doc.text(lines.slice(0, 3), x, y + 4.2);
  return y + 4.2 + Math.min(lines.length, 3) * 4.4 + 2;
};

const drawParagraph = (doc: jsPDF, text: string, y: number): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  const lines: string[] = doc.splitTextToSize(text, CONTENT);
  let cursor = y;
  lines.forEach((line) => {
    cursor = ensureSpace(doc, cursor, 5);
    doc.text(line, MARGIN, cursor);
    cursor += 4.8;
  });
  return cursor + 2;
};

const drawChecklist = (
  doc: jsPDF,
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, y, 20);
  const done = data.checklist.filter((item) => item.done).length;
  cursor = drawSectionTitle(
    doc,
    `${labels.checklist} (${done}/${data.checklist.length})`,
    cursor,
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  data.checklist.forEach((item) => {
    cursor = ensureSpace(doc, cursor, 6);
    doc.setDrawColor(...LINE);
    doc.rect(MARGIN, cursor - 3, 3.4, 3.4);
    if (item.done) {
      doc.setDrawColor(...ACCENT);
      doc.line(MARGIN + 0.6, cursor - 1.4, MARGIN + 1.5, cursor - 0.2);
      doc.line(MARGIN + 1.5, cursor - 0.2, MARGIN + 3, cursor - 2.6);
    }
    doc.setTextColor(...INK);
    const text: string = doc.splitTextToSize(item.text, CONTENT - 8)[0] ?? '';
    doc.text(text, MARGIN + 6, cursor);
    cursor += 5.4;
  });
  return cursor + 4;
};

const drawMaterials = (
  doc: jsPDF,
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, y, 20);
  cursor = drawSectionTitle(doc, labels.material, cursor);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(labels.material, MARGIN, cursor);
  doc.text(labels.quantity, WIDTH - MARGIN, cursor, { align: 'right' });
  cursor += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  cursor += 5;

  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  data.materials.forEach((item) => {
    cursor = ensureSpace(doc, cursor, 7);
    const name: string = doc.splitTextToSize(item.name, 120)[0] ?? '';
    doc.text(name, MARGIN, cursor);
    doc.text(`${item.quantity} ${item.unit}`.trim(), WIDTH - MARGIN, cursor, { align: 'right' });
    cursor += 5.6;
  });
  return cursor + 4;
};

const drawChecks = (
  doc: jsPDF,
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, y, 20);
  cursor = drawSectionTitle(doc, labels.checks, cursor);
  doc.setFontSize(9.5);
  data.checks.forEach((check) => {
    cursor = ensureSpace(doc, cursor, 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(`${check.date} · ${check.inspector || '–'} · ${check.result}`, MARGIN, cursor);
    cursor += 4.8;
    if (check.measures) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED);
      const lines: string[] = doc.splitTextToSize(check.measures, CONTENT);
      doc.text(lines.slice(0, 3), MARGIN, cursor);
      cursor += Math.min(lines.length, 3) * 4.4;
    }
    cursor += 2;
  });
  return cursor + 2;
};

const drawPhotos = (
  doc: jsPDF,
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, y, 60);
  cursor = drawSectionTitle(doc, labels.photos, cursor);
  const columns = 3;
  const gap = 4;
  const size = (CONTENT - gap * (columns - 1)) / columns;

  data.photos.slice(0, 9).forEach((photo, index) => {
    const column = index % columns;
    if (column === 0) cursor = ensureSpace(doc, cursor, size + 8);
    const x = MARGIN + column * (size + gap);
    try {
      doc.addImage(photo.url, x, cursor, size, size * 0.75, undefined, 'FAST');
    } catch {
      doc.setDrawColor(...LINE);
      doc.rect(x, cursor, size, size * 0.75);
    }
    if (photo.caption) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      const caption: string = doc.splitTextToSize(photo.caption, size)[0] ?? '';
      doc.text(caption, x, cursor + size * 0.75 + 3.2);
    }
    if (column === columns - 1) cursor += size * 0.75 + 8;
  });
  if (data.photos.length % columns !== 0) cursor += size * 0.75 + 8;
  return cursor + 2;
};

const drawFooters = (doc: jsPDF, data: CleaningPdfData): void => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Facility365 · ${data.number}`, MARGIN, HEIGHT - 10);
    doc.text(`${page}/${pages}`, WIDTH - MARGIN, HEIGHT - 10, { align: 'right' });
  }
};

export const buildCleaningPdf = (
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  branding: CleaningPdfBranding,
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = drawHeader(doc, data, labels, branding);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  const titleLines: string[] = doc.splitTextToSize(data.title || data.number, CONTENT);
  doc.text(titleLines.slice(0, 2), MARGIN, y);
  y += Math.min(titleLines.length, 2) * 6 + 4;

  const half = (CONTENT - 8) / 2;
  const areaEnd = drawPair(
    doc,
    labels.area,
    [data.areaName, data.location].filter(Boolean).join('\n'),
    MARGIN,
    y,
    half,
  );
  const placeEnd = drawPair(
    doc,
    labels.place,
    [data.propertyName, [data.buildingName, data.roomName].filter(Boolean).join(' · ')]
      .filter(Boolean)
      .join('\n'),
    MARGIN + half + 8,
    y,
    half,
  );
  y = Math.max(areaEnd, placeEnd);

  const cleanerEnd = drawPair(doc, labels.cleaner, data.cleanerName, MARGIN, y, half);
  const responsibleEnd = drawPair(
    doc,
    labels.responsible,
    [data.responsibleName, data.interval].filter(Boolean).join('\n'),
    MARGIN + half + 8,
    y,
    half,
  );
  y = Math.max(cleanerEnd, responsibleEnd) + 4;

  y = ensureSpace(doc, y, 24);
  y = drawSectionTitle(doc, labels.workTime, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text(`${labels.start}: ${data.workStart || '–'}`, MARGIN, y);
  doc.text(`${labels.end}: ${data.workEnd || '–'}`, MARGIN + 45, y);
  doc.text(`${labels.breakLabel}: ${data.breakMinutes || 0} min`, MARGIN + 90, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${labels.total}: ${data.workTotal}`, WIDTH - MARGIN, y, { align: 'right' });
  y += 10;

  if (data.checklist.length > 0) y = drawChecklist(doc, data, labels, y);
  if (data.materials.length > 0) y = drawMaterials(doc, data, labels, y);

  if (data.remarks) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, labels.remarks, y);
    y = drawParagraph(doc, data.remarks, y) + 2;
  }

  if (data.checks.length > 0) y = drawChecks(doc, data, labels, y);
  if (data.photos.length > 0) drawPhotos(doc, data, labels, y);

  drawFooters(doc, data);
  return doc;
};

export const cleaningPdfFileName = (data: CleaningPdfData): string =>
  `Reinigungsrapport-${data.number}.pdf`;

export const downloadCleaningPdf = (
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  branding: CleaningPdfBranding,
): void => {
  buildCleaningPdf(data, labels, branding).save(cleaningPdfFileName(data));
};

export const printCleaningPdf = (
  data: CleaningPdfData,
  labels: CleaningPdfLabels,
  branding: CleaningPdfBranding,
): void => {
  const doc = buildCleaningPdf(data, labels, branding);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
