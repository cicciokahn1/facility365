/**
 * Arbeitsanleitung einer Reinigungsart als PDF (A4/A3).
 *
 * Aufbau: Kopf mit Logo und Objektdaten, PSA/Sicherheit, Material und Geraete,
 * Arbeitsschritte in Phasen (Vorarbeit, Hauptarbeit, Schlussarbeit, Endkontrolle)
 * mit Piktogramm, Beschreibung und Checkbox, Ergebnis und Unterschriften.
 */
import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';
import type { CleaningPdfBranding } from '@/lib/cleaning/cleaning-pdf';
import type { CleaningPhase } from '@/lib/cleaning/checklists';

export interface CleaningInstructionStep {
  phase: CleaningPhase;
  icon: string;
  text: string;
  description: string;
}

export interface CleaningInstructionData {
  title: string;
  areaType: string;
  propertyName: string;
  buildingName: string;
  location: string;
  roomName: string;
  areaName: string;
  cleanerName: string;
  interval: string;
  date: string;
  version: string;
  ppe: { icon: string; label: string }[];
  safetyNotes: string[];
  equipment: string[];
  materials: string[];
  steps: CleaningInstructionStep[];
  phases: Record<CleaningPhase, string>;
}

export interface CleaningInstructionLabels {
  workInstruction: string;
  areaType: string;
  place: string;
  room: string;
  area: string;
  cleaner: string;
  interval: string;
  date: string;
  version: string;
  ppe: string;
  equipment: string;
  material: string;
  control: string;
  ok: string;
  rework: string;
  notDone: string;
  reworkHint: string;
  cleanerSignature: string;
  signatureDate: string;
  checkedBySignature: string;
}

const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const ACCENT: [number, number, number] = [14, 50, 85];
const LINE: [number, number, number] = [200, 208, 220];
const PANEL: [number, number, number] = [243, 246, 250];

interface Layout {
  width: number;
  height: number;
  margin: number;
  content: number;
  scale: number;
}

const layoutFor = (format: 'a4' | 'a3'): Layout => {
  const width = format === 'a3' ? 297 : 210;
  const height = format === 'a3' ? 420 : 297;
  const margin = format === 'a3' ? 20 : 16;
  return { width, height, margin, content: width - 2 * margin, scale: format === 'a3' ? 1.3 : 1 };
};

const ensureSpace = (doc: jsPDF, l: Layout, y: number, needed: number): number => {
  if (y + needed <= l.height - l.margin - 10) return y;
  doc.addPage();
  return l.margin;
};

const sectionTitle = (doc: jsPDF, l: Layout, title: string, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10 * l.scale);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), l.margin, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(l.margin, y + 1.8, l.width - l.margin, y + 1.8);
  doc.setLineWidth(0.2);
  return y + 8 * l.scale;
};

/** Grosses Piktogramm-Kuerzel in einer Box. */
const pictogram = (doc: jsPDF, x: number, y: number, size: number, icon: string): void => {
  doc.setFillColor(...PANEL);
  doc.setDrawColor(...LINE);
  doc.roundedRect(x, y, size, size, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.setFontSize(icon.length > 2 ? size * 1.5 : size * 2.1);
  doc.text(icon, x + size / 2, y + size / 2 + size * 0.28, { align: 'center' });
};

const checkbox = (doc: jsPDF, x: number, y: number, size: number): void => {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.35);
  doc.rect(x, y, size, size);
  doc.setLineWidth(0.2);
};

const drawHeader = (
  doc: jsPDF,
  l: Layout,
  data: CleaningInstructionData,
  labels: CleaningInstructionLabels,
  branding: CleaningPdfBranding,
): number => {
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: l.margin, y: l.margin, width: 36 * l.scale, height: 16 * l.scale })
    : 0;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  if (logoHeight === 0) {
    doc.setFontSize(13 * l.scale);
    doc.text('Facility365', l.margin, l.margin + 5);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8 * l.scale);
  doc.setTextColor(...MUTED);
  const brand = [branding.companyName, branding.companyAddress].filter((line) => line && line !== 'Facility365');
  brand.forEach((line, index) =>
    doc.text(line, l.margin, l.margin + (logoHeight || 6) + 4.5 + index * 4 * l.scale),
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9 * l.scale);
  doc.setTextColor(...MUTED);
  doc.text(labels.workInstruction.toUpperCase(), l.width - l.margin, l.margin + 4, { align: 'right' });
  doc.setFontSize(20 * l.scale);
  doc.setTextColor(...INK);
  const titleLines: string[] = doc.splitTextToSize(data.title, l.content * 0.6);
  doc.text(titleLines.slice(0, 2), l.width - l.margin, l.margin + 12 * l.scale, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9 * l.scale);
  doc.setTextColor(...MUTED);
  doc.text(
    `${labels.date}: ${data.date}   ·   ${labels.version}: ${data.version}`,
    l.width - l.margin,
    l.margin + 12 * l.scale + Math.min(titleLines.length, 2) * 8 * l.scale,
    { align: 'right' },
  );

  let y = l.margin + 30 * l.scale;
  doc.setDrawColor(...LINE);
  doc.line(l.margin, y, l.width - l.margin, y);
  y += 6;

  const pairs: [string, string][] = [
    [labels.areaType, data.areaType],
    [labels.place, [data.propertyName, data.buildingName, data.location].filter(Boolean).join(' · ')],
    [labels.room, [data.roomName, data.areaName].filter(Boolean).join(' · ')],
    [labels.cleaner, data.cleanerName],
    [labels.interval, data.interval],
  ];
  const columns = 3;
  const colWidth = (l.content - 6 * (columns - 1)) / columns;
  let rowEnd = y;
  pairs.forEach(([label, value], index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = l.margin + column * (colWidth + 6);
    const py = y + row * 12 * l.scale;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, py);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10 * l.scale);
    doc.setTextColor(...INK);
    const text: string = doc.splitTextToSize(value || '–', colWidth)[0] ?? '–';
    doc.text(text, x, py + 4.5 * l.scale);
    rowEnd = Math.max(rowEnd, py + 8 * l.scale);
  });
  y = rowEnd + 4;
  doc.setDrawColor(...LINE);
  doc.line(l.margin, y, l.width - l.margin, y);
  return y + 8;
};

const drawPpe = (
  doc: jsPDF,
  l: Layout,
  data: CleaningInstructionData,
  labels: CleaningInstructionLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, l, y, 40);
  cursor = sectionTitle(doc, l, labels.ppe, cursor);
  const size = 12 * l.scale;
  const gap = 4;
  const cell = (l.content - gap * (data.ppe.length - 1)) / Math.max(data.ppe.length, 1);
  data.ppe.forEach((item, index) => {
    const x = l.margin + index * (cell + gap);
    pictogram(doc, x, cursor, size, item.icon);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8 * l.scale);
    doc.setTextColor(...INK);
    const lines: string[] = doc.splitTextToSize(item.label, cell - size - 3);
    doc.text(lines.slice(0, 3), x + size + 2.5, cursor + 4 * l.scale);
  });
  cursor += size + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9 * l.scale);
  doc.setTextColor(...INK);
  data.safetyNotes.forEach((note) => {
    cursor = ensureSpace(doc, l, cursor, 6);
    const lines: string[] = doc.splitTextToSize(`• ${note}`, l.content);
    doc.text(lines, l.margin, cursor);
    cursor += lines.length * 4.6 * l.scale;
  });
  return cursor + 4;
};

const drawEquipment = (
  doc: jsPDF,
  l: Layout,
  data: CleaningInstructionData,
  labels: CleaningInstructionLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, l, y, 30);
  cursor = sectionTitle(doc, l, labels.equipment, cursor);
  const half = (l.content - 8) / 2;
  const list = (items: string[], x: number, heading: string, start: number): number => {
    let c = start;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(heading.toUpperCase(), x, c);
    c += 5 * l.scale;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5 * l.scale);
    doc.setTextColor(...INK);
    (items.length > 0 ? items : ['–']).forEach((item) => {
      checkbox(doc, x, c - 3.2, 3.6);
      const text: string = doc.splitTextToSize(item, half - 8)[0] ?? '';
      doc.text(text, x + 6, c);
      c += 5.6 * l.scale;
    });
    return c;
  };
  const left = list(data.equipment, l.margin, labels.equipment, cursor);
  const right = list(data.materials, l.margin + half + 8, labels.material, cursor);
  return Math.max(left, right) + 4;
};

const drawSteps = (
  doc: jsPDF,
  l: Layout,
  data: CleaningInstructionData,
  y: number,
): number => {
  let cursor = y;
  let number = 1;
  const size = 10 * l.scale;
  const box = 5 * l.scale;
  (Object.keys(data.phases) as CleaningPhase[]).forEach((phase) => {
    const steps = data.steps.filter((step) => step.phase === phase);
    if (steps.length === 0) return;
    cursor = ensureSpace(doc, l, cursor, 8 * l.scale + size + 4);
    cursor = sectionTitle(doc, l, data.phases[phase], cursor);
    steps.forEach((step) => {
      const rowHeight = size + 4;
      cursor = ensureSpace(doc, l, cursor, rowHeight);
      pictogram(doc, l.margin, cursor, size, step.icon);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5 * l.scale);
      doc.setTextColor(...INK);
      const textX = l.margin + size + 4;
      const textWidth = l.content - size - 4 - box - 6;
      const title: string = doc.splitTextToSize(`${number}. ${step.text}`, textWidth)[0] ?? '';
      doc.text(title, textX, cursor + 4 * l.scale);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5 * l.scale);
      doc.setTextColor(...MUTED);
      const description: string = doc.splitTextToSize(step.description, textWidth)[0] ?? '';
      doc.text(description, textX, cursor + 8.4 * l.scale);
      checkbox(doc, l.width - l.margin - box, cursor + (size - box) / 2, box);
      doc.setDrawColor(...LINE);
      doc.line(l.margin, cursor + rowHeight - 1.5, l.width - l.margin, cursor + rowHeight - 1.5);
      cursor += rowHeight;
      number += 1;
    });
    cursor += 3;
  });
  return cursor;
};

const drawResult = (
  doc: jsPDF,
  l: Layout,
  labels: CleaningInstructionLabels,
  y: number,
): number => {
  let cursor = ensureSpace(doc, l, y, 48 * l.scale);
  cursor = sectionTitle(doc, l, labels.control, cursor);
  const box = 5 * l.scale;
  const third = l.content / 3;
  [labels.ok, labels.rework, labels.notDone].forEach((label, index) => {
    const x = l.margin + index * third;
    checkbox(doc, x, cursor - 3.6, box);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10 * l.scale);
    doc.setTextColor(...INK);
    doc.text(label, x + box + 2.5, cursor);
  });
  cursor += 7 * l.scale;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8 * l.scale);
  doc.setTextColor(...MUTED);
  const hint: string[] = doc.splitTextToSize(labels.reworkHint, l.content);
  doc.text(hint, l.margin, cursor);
  cursor += hint.length * 4 * l.scale + 8;

  const half = (l.content - 8) / 2;
  const signature = (label: string, x: number, sy: number): void => {
    doc.setDrawColor(...INK);
    doc.line(x, sy, x + half, sy);
    doc.setFontSize(8 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(label, x, sy + 4);
  };
  cursor += 8;
  signature(labels.cleanerSignature, l.margin, cursor);
  signature(labels.signatureDate, l.margin + half + 8, cursor);
  cursor += 16;
  signature(labels.checkedBySignature, l.margin, cursor);
  signature(labels.signatureDate, l.margin + half + 8, cursor);
  return cursor + 8;
};

const drawFooters = (doc: jsPDF, l: Layout, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5 * l.scale);
    doc.setTextColor(...MUTED);
    doc.text(`Facility365 · ${labels.workInstruction} · ${data.title}`, l.margin, l.height - 10);
    doc.text(
      `${labels.date}: ${data.date} · ${labels.version}: ${data.version} · ${page}/${pages}`,
      l.width - l.margin,
      l.height - 10,
      { align: 'right' },
    );
  }
};

export const buildCleaningInstructionPdf = (
  data: CleaningInstructionData,
  labels: CleaningInstructionLabels,
  branding: CleaningPdfBranding,
  format: 'a4' | 'a3' = 'a4',
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format, orientation: 'portrait' });
  const l = layoutFor(format);
  let y = drawHeader(doc, l, data, labels, branding);
  y = drawPpe(doc, l, data, labels, y);
  y = drawEquipment(doc, l, data, labels, y);
  y = drawSteps(doc, l, data, y);
  drawResult(doc, l, labels, y);
  drawFooters(doc, l, data, labels);
  return doc;
};

export const downloadCleaningInstructionPdf = (
  data: CleaningInstructionData,
  labels: CleaningInstructionLabels,
  branding: CleaningPdfBranding,
  format: 'a4' | 'a3' = 'a4',
): void => {
  const mobile = window.matchMedia('(pointer: coarse)').matches;
  const viewer = mobile ? window.open('about:blank', '_blank') : null;
  const doc = buildCleaningInstructionPdf(data, labels, branding, format);
  const url = URL.createObjectURL(doc.output('blob'));
  if (mobile) {
    if (viewer) viewer.location.href = url;
    else window.location.assign(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = `facility365-arbeitsanleitung-${data.title}-${format}.pdf`
    .replace(/[^\w.-]+/g, '-')
    .toLowerCase();
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
