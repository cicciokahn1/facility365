'use client';

/**
 * Rechnung aus einem abgeschlossenen Rapport.
 *
 * Uebernommen werden Kunde, Objekt, Auftrag, Rapportnummer, Datum, Leistungen,
 * Arbeitszeit, Material und MwSt. Der Stundensatz stammt aus den Einstellungen;
 * ist dort keiner erfasst, bleibt er 0.00 statt erfunden zu werden.
 */
import { useCallback } from 'react';

import { useCollection } from '@/lib/data/store';
import { workedHours } from '@/lib/reports/work-time';
import { useSettings } from '@/lib/settings/provider';
import { Invoice, LineItem, Report } from '@/lib/types';
import { newId } from '@/lib/utils/id';
import { today } from '@/lib/utils/format';

export const invoiceItemsFromReport = (
  report: Report,
  workLabel: string,
  vatRate: number,
  hourlyRate: number,
): LineItem[] => {
  const hours = workedHours({
    start: report.workStart,
    end: report.workEnd,
    breakMinutes: report.breakMinutes,
  });
  const items: LineItem[] = [];

  if (hours > 0) {
    items.push({
      id: newId('li'),
      position: 1,
      description: `${workLabel} · ${report.number}`,
      quantity: hours,
      unit: 'h',
      unitPrice: hourlyRate,
      vatRate,
    });
  }

  report.materials.forEach((material) => {
    items.push({
      id: newId('li'),
      position: items.length + 1,
      description: material.name,
      quantity: material.quantity,
      unit: material.unit,
      unitPrice: material.price,
      vatRate,
    });
  });

  return items;
};

/** Leistungen des Rapports als Text der Rechnung; Doppelungen werden ausgelassen. */
const servicesOf = (report: Report): string =>
  [
    report.workDescription,
    report.summary === report.workDescription ? '' : report.summary,
    report.notes,
  ]
    .filter(Boolean)
    .join('\n\n');

export function useInvoiceFromReport(): (report: Report, workLabel: string) => Invoice {
  const { create } = useCollection('invoices');
  const { settings } = useSettings();

  return useCallback(
    (report: Report, workLabel: string) =>
      create({
        title: report.title || report.number,
        status: 'draft',
        customerId: report.customerId,
        propertyId: report.propertyId,
        orderId: report.orderId,
        reportId: report.id,
        date: report.date || today(),
        items: invoiceItemsFromReport(
          report,
          workLabel,
          settings.vatRate,
          settings.hourlyRate ?? 0,
        ),
        currency: settings.currency,
        notes: servicesOf(report),
      }),
    [create, settings.currency, settings.hourlyRate, settings.vatRate],
  );
}
