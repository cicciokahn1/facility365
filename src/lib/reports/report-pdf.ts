/**
 * Rapport als PDF im Format A4.
 *
 * Aufbau: Kopf mit Marke und Rapportnummer, Empfaenger und Objekt, ausgefuehrte
 * Arbeiten, Arbeitszeit, Material, Bemerkungen, Fotos und Unterschrift.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';

export interface ReportPdfMaterial {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: string;
}

export interface ReportPdfPhoto {
  url: string;
  caption: string;
}

export interface ReportPdfData {
  number: string;
  title: string;
  date: string;
  author: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  propertyName: string;
  buildingName: string;
  roomName: string;
  assetName: string;
  orderLabel: string;
  workDescription: string;
  summary: string;
  notes: string;
  workStart: string;
  workEnd: string;
  breakMinutes: number;
  workTotal: string;
  materials: ReportPdfMaterial[];
  materialTotal: string;
  photos: ReportPdfPhoto[];
  signature: string;
  signedBy: string;
  signedAt: string;
}

export interface ReportPdfLabels {
  report: string;
  number: string;
  date: string;
  author: string;
  customer: string;
  property: string;
  building: string;
  room: string;
  asset: string;
  order: string;
  work: string;
  summary: string;
  notes: string;
  workTime: string;
  start: string;
  end: string;
  breakLabel: string;
  total: string;
  material: string;
  quantity: string;
  price: string;
  photos: string;
  signature: string;
  signedBy: string;
  signedAt: string;
  notSigned: string;
}

export interface ReportPdfBranding {
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

const drawHeader = (doc: jsPDF, data: ReportPdfData, labels: ReportPdfLabels, branding: ReportPdfBranding): number => {
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
  }

  const textX = logoHeight > 0 ? MARGIN : MARGIN + 15;
  const textY = logoHeight > 0 ? MARGIN + logoHeight + 5 : MARGIN + 5;
  /** Der Schriftzug steht bereits im Logo und wird nur ohne Logo gesetzt. */
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
  if (data.author) {
    doc.text(`${labels.author}: ${data.author}`, WIDTH - MARGIN, MARGIN + 22, { align: 'right' });
  }

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

const drawPair = (doc: jsPDF, label: string, value: string, x: number, y: number, width: number): number => {
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

const drawMaterials = (doc: jsPDF, data: ReportPdfData, labels: ReportPdfLabels, y: number): number => {
  let cursor = drawSectionTitle(doc, labels.material, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(labels.material, MARGIN, cursor);
  doc.text(labels.quantity, MARGIN + 105, cursor, { align: 'right' });
  doc.text(labels.price, MARGIN + 138, cursor, { align: 'right' });
  doc.text(labels.total, WIDTH - MARGIN, cursor, { align: 'right' });
  cursor += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  cursor += 5;

  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  data.materials.forEach((item) => {
    cursor = ensureSpace(doc, cursor, 7);
    const name: string = doc.splitTextToSize(item.name, 95)[0] ?? '';
    doc.text(name, MARGIN, cursor);
    doc.text(`${item.quantity} ${item.unit}`, MARGIN + 105, cursor, { align: 'right' });
    doc.text(item.price.toFixed(2), MARGIN + 138, cursor, { align: 'right' });
    doc.text(item.total, WIDTH - MARGIN, cursor, { align: 'right' });
    cursor += 5.6;
  });

  cursor = ensureSpace(doc, cursor, 10);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN + 100, cursor - 1, WIDTH - MARGIN, cursor - 1);
  doc.setFont('helvetica', 'bold');
  doc.text(labels.total, MARGIN + 105, cursor + 4);
  doc.text(data.materialTotal, WIDTH - MARGIN, cursor + 4, { align: 'right' });
  return cursor + 12;
};

const drawPhotos = (doc: jsPDF, data: ReportPdfData, labels: ReportPdfLabels, y: number): number => {
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

const drawSignature = (doc: jsPDF, data: ReportPdfData, labels: ReportPdfLabels, y: number): number => {
  let cursor = ensureSpace(doc, y, 48);
  cursor = drawSectionTitle(doc, labels.signature, cursor);
  const boxWidth = 84;
  const boxHeight = 30;

  if (data.signature) {
    try {
      doc.addImage(data.signature, 'PNG', MARGIN, cursor, boxWidth, boxHeight, undefined, 'FAST');
    } catch {
      /* Eine unlesbare Unterschrift darf den Rapport nicht verhindern. */
    }
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(labels.notSigned, MARGIN, cursor + boxHeight / 2);
  }

  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor + boxHeight + 1, MARGIN + boxWidth, cursor + boxHeight + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${labels.signedBy}: ${data.signedBy || '–'}`, MARGIN, cursor + boxHeight + 6);
  doc.text(`${labels.signedAt}: ${data.signedAt || '–'}`, MARGIN, cursor + boxHeight + 10.5);
  return cursor + boxHeight + 16;
};

const drawFooters = (doc: jsPDF, data: ReportPdfData): void => {
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

export const buildReportPdf = (
  data: ReportPdfData,
  labels: ReportPdfLabels,
  branding: ReportPdfBranding,
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
  const leftEnd = drawPair(
    doc,
    labels.customer,
    [data.customerName, data.customerAddress].filter(Boolean).join('\n'),
    MARGIN,
    y,
    half,
  );
  const rightEnd = drawPair(
    doc,
    labels.property,
    [data.propertyName, [data.buildingName, data.roomName].filter(Boolean).join(' · ')]
      .filter(Boolean)
      .join('\n'),
    MARGIN + half + 8,
    y,
    half,
  );
  y = Math.max(leftEnd, rightEnd);

  const orderEnd = drawPair(doc, labels.order, data.orderLabel, MARGIN, y, half);
  const assetEnd = data.assetName
    ? drawPair(doc, labels.asset, data.assetName, MARGIN + half + 8, y, half)
    : y;
  y = Math.max(orderEnd, assetEnd) + 4;

  y = drawSectionTitle(doc, labels.work, y);
  /** Die Zusammenfassung nur zeigen, wenn sie mehr sagt als die Arbeitsbeschreibung. */
  const work = [
    data.workDescription,
    data.summary === data.workDescription ? '' : data.summary,
  ]
    .filter(Boolean)
    .join('\n\n');
  y = drawParagraph(doc, work || '–', y) + 2;

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

  if (data.materials.length > 0) {
    y = ensureSpace(doc, y, 30);
    y = drawMaterials(doc, data, labels, y);
  }

  if (data.notes) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, labels.notes, y);
    y = drawParagraph(doc, data.notes, y) + 2;
  }

  if (data.photos.length > 0) y = drawPhotos(doc, data, labels, y);

  drawSignature(doc, data, labels, y);
  drawFooters(doc, data);
  return doc;
};

export const reportPdfFileName = (data: ReportPdfData): string =>
  `Rapport-${data.number}.pdf`;

export const downloadReportPdf = (
  data: ReportPdfData,
  labels: ReportPdfLabels,
  branding: ReportPdfBranding,
): void => {
  buildReportPdf(data, labels, branding).save(reportPdfFileName(data));
};

export const printReportPdf = (
  data: ReportPdfData,
  labels: ReportPdfLabels,
  branding: ReportPdfBranding,
): void => {
  const doc = buildReportPdf(data, labels, branding);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
