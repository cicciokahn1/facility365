/**
 * Rechnung als PDF im Format A4.
 *
 * Aufbau: Kopf mit Marke und Rechnungsnummer, Rechnungsadresse, Bezuege
 * (Kunde, Objekt, Auftrag, Rapport), Positionen, MwSt. und Gesamttotal.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';

export interface InvoicePdfItem {
  position: number;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  total: string;
}

export interface InvoicePdfData {
  number: string;
  title: string;
  date: string;
  dueDate: string;
  reportNumber: string;
  orderLabel: string;
  propertyLabel: string;
  customerName: string;
  billingLines: string[];
  items: InvoicePdfItem[];
  net: string;
  vat: string;
  gross: string;
  notes: string;
}

export interface InvoicePdfLabels {
  invoice: string;
  number: string;
  date: string;
  dueDate: string;
  report: string;
  order: string;
  property: string;
  billTo: string;
  position: string;
  description: string;
  quantity: string;
  price: string;
  vat: string;
  total: string;
  subtotal: string;
  grandTotal: string;
  notes: string;
  vatNumber: string;
}

export interface InvoicePdfBranding {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  companyVat: string;
  logo: string;
}

const WIDTH = 210;
const HEIGHT = 297;
const MARGIN = 16;
const CONTENT = WIDTH - 2 * MARGIN;
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const ACCENT: [number, number, number] = [13, 116, 128];
const LINE: [number, number, number] = [226, 232, 240];

/** Spalten der Positionstabelle, gemessen ab dem linken Rand. */
const COL_POS = MARGIN;
const COL_DESC = MARGIN + 10;
const COL_QTY = MARGIN + 108;
const COL_PRICE = MARGIN + 134;
const COL_VAT = MARGIN + 152;
const COL_TOTAL = WIDTH - MARGIN;

const ensureSpace = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed <= HEIGHT - MARGIN - 6) return y;
  doc.addPage();
  return MARGIN;
};

const drawHeader = (
  doc: jsPDF,
  data: InvoicePdfData,
  labels: InvoicePdfLabels,
  branding: InvoicePdfBranding,
): number => {
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
  doc.text(labels.invoice, WIDTH - MARGIN, MARGIN + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(data.number, WIDTH - MARGIN, MARGIN + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${labels.date}: ${data.date || '–'}`, WIDTH - MARGIN, MARGIN + 17.5, { align: 'right' });
  if (data.dueDate) {
    doc.text(`${labels.dueDate}: ${data.dueDate}`, WIDTH - MARGIN, MARGIN + 22, { align: 'right' });
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

const drawAddress = (doc: jsPDF, data: InvoicePdfData, labels: InvoicePdfLabels, y: number): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(labels.billTo.toUpperCase(), MARGIN, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  const lines = data.billingLines.length > 0 ? data.billingLines : ['–'];
  lines.slice(0, 5).forEach((line, index) => doc.text(line, MARGIN, y + 5 + index * 5));

  const references = [
    data.reportNumber ? `${labels.report}: ${data.reportNumber}` : '',
    data.orderLabel ? `${labels.order}: ${data.orderLabel}` : '',
    data.propertyLabel ? `${labels.property}: ${data.propertyLabel}` : '',
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  references.forEach((line, index) =>
    doc.text(line, WIDTH - MARGIN, y + 5 + index * 4.6, { align: 'right' }),
  );

  const left = y + 5 + Math.min(lines.length, 5) * 5;
  const right = y + 5 + references.length * 4.6;
  return Math.max(left, right) + 6;
};

const drawItems = (doc: jsPDF, data: InvoicePdfData, labels: InvoicePdfLabels, y: number): number => {
  let cursor = drawSectionTitle(doc, labels.position, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('#', COL_POS, cursor);
  doc.text(labels.description, COL_DESC, cursor);
  doc.text(labels.quantity, COL_QTY, cursor, { align: 'right' });
  doc.text(labels.price, COL_PRICE, cursor, { align: 'right' });
  doc.text(labels.vat, COL_VAT, cursor, { align: 'right' });
  doc.text(labels.total, COL_TOTAL, cursor, { align: 'right' });
  cursor += 2;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN, cursor, WIDTH - MARGIN, cursor);
  cursor += 5;

  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  data.items.forEach((item) => {
    cursor = ensureSpace(doc, cursor, 8);
    const description: string = doc.splitTextToSize(item.description, COL_QTY - COL_DESC - 6)[0] ?? '';
    doc.text(String(item.position), COL_POS, cursor);
    doc.text(description, COL_DESC, cursor);
    doc.text(item.quantity, COL_QTY, cursor, { align: 'right' });
    doc.text(item.unitPrice, COL_PRICE, cursor, { align: 'right' });
    doc.text(item.vatRate, COL_VAT, cursor, { align: 'right' });
    doc.text(item.total, COL_TOTAL, cursor, { align: 'right' });
    cursor += 5.8;
  });

  cursor = ensureSpace(doc, cursor, 24);
  doc.setDrawColor(...LINE);
  doc.line(MARGIN + 100, cursor - 1, WIDTH - MARGIN, cursor - 1);
  cursor += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(labels.subtotal, MARGIN + 105, cursor);
  doc.setTextColor(...INK);
  doc.text(data.net, COL_TOTAL, cursor, { align: 'right' });
  cursor += 5.4;
  doc.setTextColor(...MUTED);
  doc.text(labels.vat, MARGIN + 105, cursor);
  doc.setTextColor(...INK);
  doc.text(data.vat, COL_TOTAL, cursor, { align: 'right' });
  cursor += 3;
  doc.setDrawColor(...LINE);
  doc.line(MARGIN + 100, cursor, WIDTH - MARGIN, cursor);
  cursor += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(labels.grandTotal, MARGIN + 105, cursor);
  doc.text(data.gross, COL_TOTAL, cursor, { align: 'right' });
  return cursor + 10;
};

const drawFooters = (doc: jsPDF, data: InvoicePdfData, labels: InvoicePdfLabels, branding: InvoicePdfBranding): void => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const left = branding.companyVat
      ? `Facility365 · ${data.number} · ${labels.vatNumber}: ${branding.companyVat}`
      : `Facility365 · ${data.number}`;
    doc.text(left, MARGIN, HEIGHT - 10);
    doc.text(`${page}/${pages}`, WIDTH - MARGIN, HEIGHT - 10, { align: 'right' });
  }
};

export const buildInvoicePdf = (
  data: InvoicePdfData,
  labels: InvoicePdfLabels,
  branding: InvoicePdfBranding,
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let y = drawHeader(doc, data, labels, branding);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...INK);
  const titleLines: string[] = doc.splitTextToSize(data.title || data.number, CONTENT);
  doc.text(titleLines.slice(0, 2), MARGIN, y);
  y += Math.min(titleLines.length, 2) * 6 + 4;

  y = drawAddress(doc, data, labels, y);
  y = drawItems(doc, data, labels, y);

  if (data.notes) {
    y = ensureSpace(doc, y, 20);
    y = drawSectionTitle(doc, labels.notes, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const lines: string[] = doc.splitTextToSize(data.notes, CONTENT);
    lines.forEach((line) => {
      y = ensureSpace(doc, y, 5);
      doc.text(line, MARGIN, y);
      y += 4.8;
    });
  }

  drawFooters(doc, data, labels, branding);
  return doc;
};

export const invoicePdfFileName = (data: InvoicePdfData): string => `Rechnung-${data.number}.pdf`;

export const downloadInvoicePdf = (
  data: InvoicePdfData,
  labels: InvoicePdfLabels,
  branding: InvoicePdfBranding,
): void => {
  buildInvoicePdf(data, labels, branding).save(invoicePdfFileName(data));
};

export const printInvoicePdf = (
  data: InvoicePdfData,
  labels: InvoicePdfLabels,
  branding: InvoicePdfBranding,
): void => {
  const doc = buildInvoicePdf(data, labels, branding);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};
