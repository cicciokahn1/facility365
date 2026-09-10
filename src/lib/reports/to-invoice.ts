'use client';

/**
 * Rechnung aus einem abgeschlossenen Rapport.
 *
 * Uebernommen werden Kunde, Objekt, Auftrag, Rapportnummer, Datum, Leistungen,
 * Arbeitszeit, Material und MwSt. Der Stundensatz folgt der Zuordnung:
 * Rapport/Auftrag, Person, externe Firma, Rolle.
 */
import { useCallback } from 'react';

import { useCollection, useCollectionItems } from '@/lib/data/store';
import { hourlyRateFor } from '@/lib/reports/hourly-rate';
import { workedHours } from '@/lib/reports/work-time';
import { useSettings } from '@/lib/settings/provider';
import { Invoice, InvoicePaymentData, LineItem, Report } from '@/lib/types';
import { referenceFor } from '@/lib/invoices/swiss-qr';
import { newId } from '@/lib/utils/id';
import { today } from '@/lib/utils/format';

export const invoiceItemsFromReport = (
  report: Report,
  workLabel: string,
  vatRate: number,
  hourlyRate: number,
  additionalMaterials: LineItem[] = [],
): LineItem[] => {
  const hours = workedHours({
    start: report.workStart,
    end: report.workEnd,
    breakMinutes: report.breakMinutes,
  });
  const items: LineItem[] = [];

    if (hours > 0 && report.billable !== false && !report.invoicedInvoiceId) {
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

  report.materials.filter((material) => material.billable !== false && !material.invoicedInvoiceId).forEach((material) => {
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

  return [...items, ...additionalMaterials.map((item, index) => ({
    ...item,
    id: newId('li'),
    position: items.length + index + 1,
    vatRate,
  }))];
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
  const { create, update } = useCollection('invoices');
  const { update: updateReport } = useCollection('reports');
  const invoices = useCollectionItems('invoices');
  const { items: orders } = useCollection('orders');
  const users = useCollectionItems('users');
  const suppliers = useCollectionItems('suppliers');
  const { settings } = useSettings();

  return useCallback(
    (report: Report, workLabel: string) => {
      const existing = report.invoicedInvoiceId
        ? invoices.find((invoice) => invoice.id === report.invoicedInvoiceId)
        : undefined;
      if (existing) return existing;
      const payment: InvoicePaymentData = {
        recipient: settings.paymentRecipient,
        address: settings.paymentAddress,
        iban: settings.paymentIban,
        qrIban: settings.paymentQrIban,
        bank: settings.paymentBank,
        bic: settings.paymentBic,
        referenceType: settings.paymentReferenceType,
      };
      const order = orders.find((entry) => entry.id === report.orderId);
      const user = users.find((entry) => entry.id === order?.assigneeUserId);
      const supplier = suppliers.find((entry) => entry.id === order?.supplierId);
      const additionalMaterials = report.materials.length > 0
        ? (report.externalServices ?? [])
        : [...(order?.materials ?? []), ...(order?.externalServices ?? [])];
      const invoice = create({
        title: report.title || report.number,
        status: 'draft',
        customerId: report.customerId,
        propertyId: report.propertyId,
        orderId: report.orderId,
        /** Stammt der Auftrag aus einer Offerte, bleibt sie bis in die Rechnung sichtbar. */
        quoteId: orders.find((order) => order.id === report.orderId)?.quoteId ?? '',
        reportId: report.id,
        date: report.date || today(),
        items: invoiceItemsFromReport(
            report,
            workLabel,
            settings.vatRate,
            hourlyRateFor({
              explicit: report.hourlyRate ?? order?.hourlyRate,
              user,
              supplier,
              settings,
            }),
            additionalMaterials.map((material) => ({
              id: material.id,
              position: 0,
              description: material.name,
              quantity: material.quantity,
              unit: material.unit,
              unitPrice: material.price,
              vatRate: settings.vatRate,
            })),
          ),
        currency: settings.currency,
        notes: servicesOf(report),
        payment,
      });
      const qrReference = referenceFor(invoice.number, payment);
      update(invoice.id, { qrReference, payment });
      updateReport(report.id, {
        invoicedAt: new Date().toISOString(),
        invoicedInvoiceId: invoice.id,
        materials: report.materials.map((material) =>
          material.billable === false || material.invoicedInvoiceId
            ? material
            : { ...material, invoicedAt: new Date().toISOString(), invoicedInvoiceId: invoice.id },
        ),
        externalServices: report.externalServices?.map((service) =>
          service.billable === false || service.invoicedInvoiceId
            ? service
            : { ...service, invoicedAt: new Date().toISOString(), invoicedInvoiceId: invoice.id },
        ),
      });
      return { ...invoice, qrReference, payment };
    },
    [
      create,
      invoices,
      update,
      updateReport,
      orders,
      suppliers,
      users,
      settings.currency,
      settings.roleHourlyRates,
      settings.paymentAddress,
      settings.paymentBank,
      settings.paymentBic,
      settings.paymentIban,
      settings.paymentQrIban,
      settings.paymentRecipient,
      settings.paymentReferenceType,
      settings.vatRate,
    ],
  );
}
