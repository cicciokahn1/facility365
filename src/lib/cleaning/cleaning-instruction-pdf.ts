/**
 * Arbeitsanleitung einer Reinigungsart als PDF (A4/A3).
 *
 * Tabellenlayout nach Vorbild klassischer Reinigungs-Arbeitsanleitungen:
 * linke Spalte mit Begriff/Arbeitsmittel/Piktogramm, rechts die Zeilen.
 * Abschnitte als blaue Bänder: Reinigungsart, Reinigungsmaterial,
 * Reinigungsmittel, PSA/Sicherheit, Vorarbeit, Hauptarbeit, Schlussarbeit,
 * Blick zurück/Endkontrolle. Jeder Arbeitsschritt mit Checkbox.
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
  /** Arbeitsmittel des Schritts (linke Spalte), leer wenn nicht eindeutig. */
  tool: string;
}

export interface CleaningInstructionData {
  title: string;
  areaType: string;
  /** Methode, z. B. «Scheuersaugmaschine – indirekte Methode». */
  method: string;
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
  /** Reinigungsmaterial und Geräte mit Mengen. */
  equipment: string[];
  /** Zusätzliches Material aus der Aufgabe. */
  materials: string[];
  /** Reinigungsmittel (Anwendung/Dosierung gemäss Hersteller). */
  agents: string[];
  dosageNote: string;
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
  agents: string;
  control: string;
  ok: string;
  rework: string;
  notDone: string;
  reworkHint: string;
  cleanerSignature: string;
  signatureDate: string;
  checkedBySignature: string;
  page: string;
  updated: string;
}

const INK: [number, number, number] = [0, 0, 0];
const MUTED: [number, number, number] = [90, 90, 90];
const BAND: [number, number, number] = [31, 90, 166];
const LINE: [number, number, number] = [120, 120, 120];
const WARN: [number, number, number] = [255, 204, 0];
const WHITE: [number, number, number] = [255, 255, 255];

interface Layout {
  width: number;
  height: number;
  margin: number;
  content: number;
  /** Breite der linken Begriffsspalte. */
  label: number;
  /** Breite der Checkbox-Spalte rechts. */
  check: number;
  scale: number;
  top: number;
  bottom: number;
}

const layoutFor = (format: 'a4' | 'a3'): Layout => {
  const a3 = format === 'a3';
  const width = a3 ? 297 : 210;
  const height = a3 ? 420 : 297;
  const margin = a3 ? 18 : 12;
  const scale = a3 ? 1.35 : 1;
  return {
    width,
    height,
    margin,
    content: width - 2 * margin,
    label: 44 * scale,
    check: 10 * scale,
    scale,
    top: margin + 8 * scale,
    bottom: height - margin - 8 * scale,
  };
};

interface Ctx {
  doc: jsPDF;
  l: Layout;
  y: number;
  title: string;
  workInstruction: string;
}

const pageTitle = (ctx: Ctx): void => {
  const { doc, l } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11 * l.scale);
  doc.setTextColor(...INK);
  doc.text(`Facility365 – ${ctx.workInstruction}`, l.width / 2, l.margin + 4 * l.scale, { align: 'center' });
};

const ensureSpace = (ctx: Ctx, needed: number): void => {
  if (ctx.y + needed <= ctx.l.bottom) return;
  ctx.doc.addPage();
  pageTitle(ctx);
  ctx.y = ctx.l.top;
};

const cell = (doc: jsPDF, x: number, y: number, w: number, h: number, fill?: [number, number, number]): void => {
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.25);
  if (fill) {
    doc.setFillColor(...fill);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h);
  }
};

const checkbox = (doc: jsPDF, x: number, y: number, size: number): void => {
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.rect(x, y, size, size);
  doc.setLineWidth(0.25);
};

/** Blaues Abschnittsband; optional mit Wert in der rechten Spalte. */
const band = (ctx: Ctx, label: string, value?: string): void => {
  const { doc, l } = ctx;
  const h = 7.5 * l.scale;
  ensureSpace(ctx, h + 8 * l.scale);
  const x = l.margin;
  if (value) {
    cell(doc, x, ctx.y, l.label, h, BAND);
    cell(doc, x + l.label, ctx.y, l.content - l.label, h, WHITE);
  } else {
    cell(doc, x, ctx.y, l.content, h, BAND);
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5 * l.scale);
  doc.setTextColor(...WHITE);
  doc.text(`${label}:`, x + 2, ctx.y + h - 2.3 * l.scale);
  if (value) {
    doc.setTextColor(...INK);
    const text: string = doc.splitTextToSize(value, l.content - l.label - 4)[0] ?? '';
    doc.text(text, x + l.label + 2, ctx.y + h - 2.3 * l.scale);
  }
  ctx.y += h;
};

interface RowOptions {
  label?: string;
  bold?: boolean;
  italic?: boolean;
  checkbox?: boolean;
  small?: boolean;
  /** Zeichnet links statt Text ein Piktogramm. */
  draw?: (x: number, y: number, h: number) => void;
  minHeight?: number;
}

/** Tabellenzeile: linke Begriffsspalte, rechte Textspalte, optional Checkbox. */
const row = (ctx: Ctx, text: string, options: RowOptions = {}): void => {
  const { doc, l } = ctx;
  const fontSize = (options.small ? 8.5 : 10) * l.scale;
  const lineHeight = fontSize * 0.42;
  const checkWidth = options.checkbox ? l.check : 0;
  const textWidth = l.content - l.label - checkWidth - 4;
  const style = options.bold && options.italic ? 'bolditalic' : options.bold ? 'bold' : options.italic ? 'italic' : 'normal';
  doc.setFont('helvetica', style);
  doc.setFontSize(fontSize);
  const lines: string[] = doc.splitTextToSize(text, textWidth);
  const h = Math.max(options.minHeight ?? 0, lines.length * lineHeight + 2.6 * l.scale, 6.2 * l.scale);
  ensureSpace(ctx, h);
  doc.setFont('helvetica', style);
  doc.setFontSize(fontSize);
  const x = l.margin;
  cell(doc, x, ctx.y, l.label, h);
  cell(doc, x + l.label, ctx.y, l.content - l.label - checkWidth, h);
  if (options.checkbox) {
    cell(doc, x + l.content - checkWidth, ctx.y, checkWidth, h);
    const size = 4.6 * l.scale;
    checkbox(doc, x + l.content - checkWidth / 2 - size / 2, ctx.y + h / 2 - size / 2, size);
  }
  doc.setTextColor(...INK);
  doc.text(lines, x + l.label + 2, ctx.y + 1.9 * l.scale + lineHeight * 0.8);
  if (options.draw) {
    options.draw(x, ctx.y, h);
  } else if (options.label) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9 * l.scale);
    const labelLines: string[] = doc.splitTextToSize(options.label, l.label - 4);
    doc.text(labelLines.slice(0, 2), x + 2, ctx.y + 1.9 * l.scale + lineHeight * 0.8);
  }
  ctx.y += h;
};

/* --- Piktogramme (Gebotszeichen blau, Warnzeichen gelb, Symbolkürzel) --- */

const mandatorySign = (doc: jsPDF, cx: number, cy: number, r: number, glyph: string): void => {
  doc.setFillColor(...BAND);
  doc.setDrawColor(...BAND);
  doc.circle(cx, cy, r, 'F');
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(r * 0.14);
  if (glyph === 'H') {
    // Handschuh: Handfläche + Finger + Daumen
    doc.roundedRect(cx - r * 0.32, cy - r * 0.15, r * 0.64, r * 0.62, r * 0.12, r * 0.12, 'F');
    [-0.27, -0.09, 0.09, 0.27].forEach((dx, index) => {
      const fh = index === 0 || index === 3 ? r * 0.45 : r * 0.58;
      doc.roundedRect(cx + dx * r - r * 0.07, cy - r * 0.15 - fh, r * 0.14, fh + r * 0.1, r * 0.06, r * 0.06, 'F');
    });
    doc.roundedRect(cx - r * 0.58, cy - r * 0.05, r * 0.3, r * 0.14, r * 0.06, r * 0.06, 'F');
  } else if (glyph === 'A') {
    // Schutzbrille: zwei Gläser mit Steg und Bügeln
    doc.circle(cx - r * 0.3, cy, r * 0.26, 'S');
    doc.circle(cx + r * 0.3, cy, r * 0.26, 'S');
    doc.line(cx - r * 0.04, cy, cx + r * 0.04, cy);
    doc.line(cx - r * 0.56, cy - r * 0.05, cx - r * 0.75, cy - r * 0.2);
    doc.line(cx + r * 0.56, cy - r * 0.05, cx + r * 0.75, cy - r * 0.2);
  } else if (glyph === 'S') {
    // Schuh: Schaft und Sohle
    doc.roundedRect(cx - r * 0.45, cy - r * 0.45, r * 0.42, r * 0.7, r * 0.08, r * 0.08, 'F');
    doc.roundedRect(cx - r * 0.5, cy + r * 0.12, r * 1.05, r * 0.3, r * 0.1, r * 0.1, 'F');
  } else if (glyph === 'K') {
    // Arbeitskleidung: T-Shirt
    doc.triangle(cx - r * 0.7, cy - r * 0.35, cx - r * 0.25, cy - r * 0.6, cx - r * 0.3, cy - r * 0.05, 'F');
    doc.triangle(cx + r * 0.7, cy - r * 0.35, cx + r * 0.25, cy - r * 0.6, cx + r * 0.3, cy - r * 0.05, 'F');
    doc.rect(cx - r * 0.35, cy - r * 0.55, r * 0.7, r * 1.15, 'F');
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(r * 3.2);
    doc.setTextColor(...WHITE);
    doc.text(glyph, cx, cy + r * 0.42, { align: 'center' });
  }
  doc.setLineWidth(0.25);
};

const warningSign = (doc: jsPDF, cx: number, cy: number, r: number): void => {
  doc.setFillColor(...WARN);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.triangle(cx, cy - r, cx - r * 1.05, cy + r * 0.8, cx + r * 1.05, cy + r * 0.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(r * 3.4);
  doc.setTextColor(...INK);
  doc.text('!', cx, cy + r * 0.6, { align: 'center' });
  doc.setLineWidth(0.25);
};

/** Grosses Symbolkürzel der Reinigungsart als Piktogramm-Kachel. */
const typePictogram = (doc: jsPDF, x: number, y: number, size: number, icon: string): void => {
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BAND);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, size, size, size * 0.12, size * 0.12, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BAND);
  doc.setFontSize(icon.length > 2 ? size * 1.3 : size * 2);
  doc.text(icon, x + size / 2, y + size / 2 + size * 0.27, { align: 'center' });
  doc.setLineWidth(0.25);
};

const iconForType = (title: string, method: string): string => {
  const key = `${title} ${method}`.toLowerCase();
  if (key.includes('wc') || key.includes('sanit')) return 'WC';
  if (key.includes('scheuer') || key.includes('autolav') || key.includes('lavasc') || key.includes('scrubber')) return 'M';
  if (key.includes('fenster') || key.includes('vitre') || key.includes('vetri') || key.includes('window')) return 'F';
  if (key.includes('boden') || key.includes('sol') || key.includes('pavim') || key.includes('floor')) return 'B';
  if (key.includes('desinf') || key.includes('disinf')) return 'D';
  if (key.includes('abfall') || key.includes('déchet') || key.includes('rifiut') || key.includes('waste')) return 'A';
  if (key.includes('küche') || key.includes('cuisine') || key.includes('cucina') || key.includes('kitchen')) return 'K';
  if (key.includes('treppe') || key.includes('escalier') || key.includes('scale') || key.includes('stair')) return 'T';
  return 'R';
};

/* --- Abschnitte --- */

const drawHeader = (ctx: Ctx, data: CleaningInstructionData, branding: CleaningPdfBranding): void => {
  const { doc, l } = ctx;
  pageTitle(ctx);
  ctx.y = l.top;
  const h = 20 * l.scale;
  cell(doc, l.margin, ctx.y, l.label, h);
  cell(doc, l.margin + l.label, ctx.y, l.content - l.label, h);
  const logoHeight = branding.logo
    ? drawLogo(doc, branding.logo, { x: l.margin + 2, y: ctx.y + 2, width: l.label - 4, height: h - 4 })
    : 0;
  if (logoHeight === 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12 * l.scale);
    doc.setTextColor(...BAND);
    doc.text('Facility365', l.margin + l.label / 2, ctx.y + h / 2 + 1.5, { align: 'center' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20 * l.scale);
  doc.setTextColor(...INK);
  const title: string = doc.splitTextToSize(data.title, l.content - l.label - 60 * l.scale)[0] ?? data.title;
  doc.text(title, l.margin + l.label + 3, ctx.y + h / 2 + 2.5 * l.scale);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8 * l.scale);
  doc.setTextColor(...MUTED);
  const brand = [branding.companyName, branding.companyAddress].filter(
    (line) => line && line !== 'Facility365',
  );
  brand.slice(0, 2).forEach((line, index) =>
    doc.text(line, l.width - l.margin - 2, ctx.y + 5 * l.scale + index * 4 * l.scale, { align: 'right' }),
  );
  ctx.y += h;
};

const drawObject = (ctx: Ctx, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const place = [data.propertyName, data.buildingName, data.location].filter(Boolean).join(' · ');
  const room = [data.roomName, data.areaName].filter(Boolean).join(' · ');
  const who = [data.cleanerName, data.interval].filter(Boolean).join(' · ');
  if (!place && !room && !who) return;
  if (place) row(ctx, place, { label: labels.place });
  if (room) row(ctx, room, { label: `${labels.room} / ${labels.area}` });
  if (who) row(ctx, who, { label: `${labels.cleaner} / ${labels.interval}` });
};

const drawMaterial = (ctx: Ctx, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const { doc, l } = ctx;
  band(ctx, labels.equipment);
  const items = [...data.equipment, ...data.materials];
  const start = ctx.y;
  const startPage = doc.getCurrentPageInfo().pageNumber;
  (items.length > 0 ? items : ['–']).forEach((item) => row(ctx, item));
  if (doc.getCurrentPageInfo().pageNumber === startPage) {
    const size = Math.min(l.label - 8, ctx.y - start - 4, 30 * l.scale);
    if (size > 10) {
      typePictogram(doc, l.margin + (l.label - size) / 2, start + (ctx.y - start - size) / 2, size, iconForType(data.title, data.method));
    }
  }
};

const drawAgents = (ctx: Ctx, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const agents = data.agents.length > 0 ? data.agents : ['–'];
  agents.forEach((agent, index) => row(ctx, agent, { label: index === 0 ? labels.agents : undefined }));
  row(ctx, data.dosageNote, { italic: true, small: true });
};

const drawSafety = (ctx: Ctx, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const { doc, l } = ctx;
  band(ctx, labels.ppe);
  const r = 4.2 * l.scale;
  data.ppe.forEach((item) =>
    row(ctx, item.label, {
      minHeight: r * 2 + 3,
      draw: (x, y, h) => mandatorySign(doc, x + l.label / 2, y + h / 2, r, item.icon),
    }),
  );
  data.safetyNotes.forEach((note, index) =>
    row(ctx, note, {
      bold: true,
      italic: true,
      minHeight: index === 0 ? r * 2 + 3 : 0,
      draw: index === 0 ? (x, y, h) => warningSign(doc, x + l.label / 2, y + h / 2, r) : undefined,
    }),
  );
};

const drawSteps = (ctx: Ctx, data: CleaningInstructionData): void => {
  let number = 1;
  (Object.keys(data.phases) as CleaningPhase[]).forEach((phase) => {
    const steps = data.steps.filter((step) => step.phase === phase);
    if (steps.length === 0) return;
    band(ctx, data.phases[phase]);
    steps.forEach((step) => {
      const text = step.description ? `${number}. ${step.text} – ${step.description}` : `${number}. ${step.text}`;
      row(ctx, text, { label: step.tool, checkbox: true });
      number += 1;
    });
  });
};

const drawResult = (ctx: Ctx, labels: CleaningInstructionLabels): void => {
  const { doc, l } = ctx;
  ensureSpace(ctx, 40 * l.scale);
  const h = 9 * l.scale;
  cell(doc, l.margin, ctx.y, l.label, h);
  cell(doc, l.margin + l.label, ctx.y, l.content - l.label, h);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9 * l.scale);
  doc.setTextColor(...INK);
  doc.text(labels.control, l.margin + 2, ctx.y + h / 2 + 1.5);
  const box = 4.6 * l.scale;
  const third = (l.content - l.label) / 3;
  [labels.ok, labels.rework, labels.notDone].forEach((label, index) => {
    const x = l.margin + l.label + 3 + index * third;
    checkbox(doc, x, ctx.y + h / 2 - box / 2, box);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10 * l.scale);
    doc.text(label, x + box + 2, ctx.y + h / 2 + 1.5);
  });
  ctx.y += h;
  row(ctx, labels.reworkHint, { small: true, italic: true });

  const sh = 14 * l.scale;
  ensureSpace(ctx, sh);
  const half = l.content / 2;
  cell(doc, l.margin, ctx.y, half, sh);
  cell(doc, l.margin + half, ctx.y, half, sh);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8 * l.scale);
  doc.setTextColor(...MUTED);
  doc.text(`${labels.cleanerSignature} / ${labels.signatureDate}`, l.margin + 2, ctx.y + 3.5 * l.scale);
  doc.text(`${labels.checkedBySignature} / ${labels.signatureDate}`, l.margin + half + 2, ctx.y + 3.5 * l.scale);
  ctx.y += sh;
};

const drawFooters = (ctx: Ctx, data: CleaningInstructionData, labels: CleaningInstructionLabels): void => {
  const { doc, l } = ctx;
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5 * l.scale);
    doc.setTextColor(...MUTED);
    const y = l.height - l.margin + 2;
    const name: string =
      doc.splitTextToSize(`Facility365_${labels.workInstruction}_${data.title}`, l.content * 0.45)[0] ?? '';
    doc.text(name, l.margin, y);
    doc.text(
      `${labels.updated} ${data.date} · ${labels.version} ${data.version} · ${labels.page} ${page}/${pages}`,
      l.width - l.margin,
      y,
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
  const ctx: Ctx = { doc, l, y: l.top, title: data.title, workInstruction: labels.workInstruction };
  drawHeader(ctx, data, branding);
  drawObject(ctx, data, labels);
  band(ctx, labels.areaType, data.method || data.areaType);
  drawMaterial(ctx, data, labels);
  drawAgents(ctx, data, labels);
  drawSafety(ctx, data, labels);
  drawSteps(ctx, data);
  drawResult(ctx, labels);
  drawFooters(ctx, data, labels);
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
