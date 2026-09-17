import { jsPDF } from 'jspdf';

import { drawLogo } from '@/lib/branding/pdf-logo';
import { guidanceFor } from '@/lib/cleaning/checklists';
import type { Language } from '@/lib/i18n/dictionary';

export interface CleaningScheduleRow {
  sortKey: string;
  date: string;
  time: string;
  title: string;
  building: string;
  room: string;
  area: string;
  cleaner: string;
  checklist: string[];
}

export interface CleaningScheduleLabels {
  weeklyPlan: string;
  roomSheets: string;
  date: string;
  time: string;
  building: string;
  room: string;
  area: string;
  cleaner: string;
  instructions: string;
  signature: string;
  checkedBy: string;
  checkDate: string;
  problem: string;
  none: string;
  language: Language;
  ok: string;
  rework: string;
  notDone: string;
}

export interface CleaningScheduleBranding {
  companyName: string;
  companyAddress: string;
  logo: string;
}

const WIDTH = 210;
const HEIGHT = 297;
const MARGIN = 16;
const INK: [number, number, number] = [20, 33, 52];
const MUTED: [number, number, number] = [92, 104, 124];
const LINE: [number, number, number] = [226, 232, 240];

const footer = (doc: jsPDF, branding: CleaningScheduleBranding): void => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text(branding.companyName || 'Facility365', MARGIN, HEIGHT - 8);
  doc.text('Facility365', WIDTH - MARGIN, HEIGHT - 8, { align: 'right' });
};

const header = (
  doc: jsPDF,
  title: string,
  branding: CleaningScheduleBranding,
): number => {
  if (branding.logo) {
    drawLogo(doc, branding.logo, { x: MARGIN, y: MARGIN, width: 30, height: 16 });
  }
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, MARGIN, MARGIN + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text([branding.companyName, branding.companyAddress].filter(Boolean).join(' · '), MARGIN, MARGIN + 31);
  return MARGIN + 42;
};

const checkbox = (doc: jsPDF, x: number, y: number, label: string): void => {
  doc.setDrawColor(...INK);
  doc.rect(x, y - 4, 4.5, 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(label, x + 8, y);
};

export const buildCleaningSchedulePdf = (
  rows: CleaningScheduleRow[],
  labels: CleaningScheduleLabels,
  branding: CleaningScheduleBranding,
  mode: 'weekly' | 'roomSheets',
): jsPDF => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const title = mode === 'weekly' ? labels.weeklyPlan : labels.roomSheets;
  let y = header(doc, title, branding);

  if (rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(labels.none, MARGIN, y);
    footer(doc, branding);
    return doc;
  }

  if (mode === 'weekly') {
    rows.forEach((row) => {
      if (y > HEIGHT - 30) {
        footer(doc, branding);
        doc.addPage();
        y = header(doc, title, branding);
      }
      doc.setDrawColor(...LINE);
      doc.line(MARGIN, y - 5, WIDTH - MARGIN, y - 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(`${row.date} · ${row.time || '–'}`, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(row.title || row.area || 'Reinigung', MARGIN + 48, y);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text([row.building, row.room, row.area, row.cleaner].filter(Boolean).join(' · '), MARGIN + 48, y + 5);
      y += 15;
    });
  } else {
    rows.forEach((row, index) => {
      if (index > 0) {
        footer(doc, branding);
        doc.addPage();
        y = header(doc, title, branding);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...INK);
      doc.text(row.room || row.area || row.title, MARGIN, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text([row.building, row.area, row.date, row.time, row.cleaner].filter(Boolean).join(' · '), MARGIN, y);
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text(labels.instructions, MARGIN, y);
      y += 8;
      row.checklist.forEach((item) => {
        const guidance = guidanceFor(item, labels.language);
        checkbox(doc, MARGIN + 2, y, `${guidance.icon} ${item}`);
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        doc.text(guidance.description, MARGIN + 10, y + 4);
        doc.text(`${labels.ok} □  ${labels.rework} □  ${labels.notDone} □`, WIDTH - MARGIN, y, {
          align: 'right',
        });
        y += 11;
      });
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${labels.problem}: ______________________________________________`, MARGIN, y);
      y += 14;
      doc.text(`${labels.signature}: _____________________________________________`, MARGIN, y);
      y += 9;
      doc.text(`${labels.checkedBy}: ____________________________________________`, MARGIN, y);
      y += 9;
      doc.text(`${labels.checkDate}: ____________________________________________`, MARGIN, y);
    });
  }

  footer(doc, branding);
  return doc;
};

export const downloadCleaningSchedulePdf = (
  rows: CleaningScheduleRow[],
  labels: CleaningScheduleLabels,
  branding: CleaningScheduleBranding,
  mode: 'weekly' | 'roomSheets',
): void => {
  const doc = buildCleaningSchedulePdf(rows, labels, branding, mode);
  doc.save(`facility365-reinigung-${mode}.pdf`);
};
