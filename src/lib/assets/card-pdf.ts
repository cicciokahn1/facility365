/**
 * A6-Anlagenkarte als PDF.
 *
 * Eine Karte je Anlage im Hochformat 105 x 148 mm, geeignet zum Ausdrucken,
 * Laminieren oder Aufkleben. Mehrere Anlagen ergeben ein mehrseitiges PDF.
 */
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import { assetCodeUrl } from '@/lib/assets/passport';
import { drawLogo as drawBrandLogo } from '@/lib/branding/pdf-logo';

export interface CardAsset {
  number: string;
  name: string;
  location: string;
  building: string;
  room: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
}

export interface CardLabels {
  id: string;
  location: string;
  building: string;
  room: string;
  manufacturer: string;
  model: string;
  serial: string;
  hint: string;
}

export interface CardBranding {
  companyName: string;
  /** Firmenlogo als Data-URL; leer, wenn keines hinterlegt ist. */
  logo: string;
}

const WIDTH = 105;
const HEIGHT = 148;
const MARGIN = 8;
const QR_SIZE = 46;
/** Oberkante des QR-Codes; darueber bleibt Platz fuer die Angaben. */
const QR_TOP = HEIGHT - MARGIN - QR_SIZE - 10;
const ROW_HEIGHT = 7.6;
const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const ACCENT: [number, number, number] = [14, 50, 85];

const qrDataUrl = (value: string): Promise<string> =>
  QRCode.toDataURL(value, { margin: 0, width: 600, errorCorrectionLevel: 'M' });

const drawLogo = (doc: jsPDF, branding: CardBranding): number => {
  const logoHeight = branding.logo
    ? drawBrandLogo(doc, branding.logo, { x: MARGIN, y: MARGIN, width: 34, height: 16 })
    : 0;
  if (logoHeight === 0) {
    doc.setFillColor(...ACCENT);
    doc.roundedRect(MARGIN, MARGIN, 10, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('F3', MARGIN + 5, MARGIN + 6.6, { align: 'center' });
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Facility365', MARGIN + 13, MARGIN + 7);
  }

  let bottom = logoHeight > 0 ? MARGIN + logoHeight + 3 : MARGIN + 10;
  if (branding.companyName && branding.companyName !== 'Facility365') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(branding.companyName, logoHeight > 0 ? MARGIN : MARGIN + 13, bottom + 1);
    bottom += 4;
  }
  return bottom;
};

/** Eine Zeile Angaben; ausserhalb des Platzes wird nichts mehr gezeichnet. */
const drawRow = (doc: jsPDF, label: string, value: string, y: number): number => {
  if (y + ROW_HEIGHT > QR_TOP) return y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  const line = doc.splitTextToSize(value || '–', WIDTH - 2 * MARGIN)[0] ?? '–';
  doc.text(line, MARGIN, y + 3.6);
  return y + ROW_HEIGHT;
};

const drawCard = async (
  doc: jsPDF,
  asset: CardAsset,
  labels: CardLabels,
  branding: CardBranding,
): Promise<void> => {
  let y = drawLogo(doc, branding) + 4;

  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, WIDTH - MARGIN, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  const nameLines: string[] = doc.splitTextToSize(asset.name || asset.number, WIDTH - 2 * MARGIN);
  doc.text(nameLines.slice(0, 2), MARGIN, y);
  y += Math.min(nameLines.length, 2) * 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text(asset.number, MARGIN, y + 3);
  y += 8;

  y = drawRow(doc, labels.location, asset.location, y);
  y = drawRow(doc, labels.building, asset.building, y);
  y = drawRow(doc, labels.room, asset.room, y);
  y = drawRow(
    doc,
    `${labels.manufacturer} · ${labels.model}`,
    [asset.manufacturer, asset.model].filter(Boolean).join(' · '),
    y,
  );
  drawRow(doc, labels.serial, asset.serialNumber, y);

  const image = await qrDataUrl(assetCodeUrl(asset.number));
  const qrX = (WIDTH - QR_SIZE) / 2;
  const qrY = QR_TOP + 2;
  doc.addImage(image, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE, undefined, 'FAST');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...MUTED);
  const hint = doc.splitTextToSize(labels.hint, WIDTH - 2 * MARGIN);
  doc.text(hint, WIDTH / 2, qrY + QR_SIZE + 4.5, { align: 'center' });
};

/** Ein PDF mit je einer A6-Karte pro Anlage. */
export const buildAssetCards = async (
  assets: CardAsset[],
  labels: CardLabels,
  branding: CardBranding,
): Promise<jsPDF> => {
  const doc = new jsPDF({ unit: 'mm', format: [WIDTH, HEIGHT], orientation: 'portrait' });
  for (let index = 0; index < assets.length; index += 1) {
    if (index > 0) doc.addPage([WIDTH, HEIGHT], 'portrait');
    await drawCard(doc, assets[index], labels, branding);
  }
  return doc;
};

export const downloadAssetCards = async (
  assets: CardAsset[],
  labels: CardLabels,
  branding: CardBranding,
): Promise<void> => {
  const doc = await buildAssetCards(assets, labels, branding);
  const name = assets.length === 1 ? `${assets[0].number}-A6.pdf` : 'anlagenkarten-A6.pdf';
  doc.save(name);
};

export const printAssetCards = async (
  assets: CardAsset[],
  labels: CardLabels,
  branding: CardBranding,
): Promise<void> => {
  const doc = await buildAssetCards(assets, labels, branding);
  doc.autoPrint();
  const url = doc.output('bloburl');
  window.open(url, '_blank');
};
