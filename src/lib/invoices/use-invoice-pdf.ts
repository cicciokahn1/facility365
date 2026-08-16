'use client';

/** Rechnungsdaten fuer das PDF sammeln, herunterladen und drucken. */
import { useCallback } from 'react';

import { lineItemTotals } from '@/components/module/line-item-editor';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import {
  InvoicePdfBranding,
  InvoicePdfData,
  InvoicePdfLabels,
  downloadInvoicePdf,
  invoicePdfFileName,
  printInvoicePdf,
} from '@/lib/invoices/invoice-pdf';
import { useSettings } from '@/lib/settings/provider';
import { Address, Invoice } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils/format';

export interface InvoicePdfApi {
  data: (invoice: Invoice) => InvoicePdfData;
  download: (invoice: Invoice) => void;
  print: (invoice: Invoice) => void;
  fileName: (invoice: Invoice) => string;
}

const addressLines = (address: Address | undefined): string[] =>
  address
    ? [address.street, [address.zip, address.city].filter(Boolean).join(' '), address.country].filter(
        (line): line is string => Boolean(line),
      )
    : [];

export function useInvoicePdf(): InvoicePdfApi {
  const t = useT();
  const { settings } = useSettings();
  const customers = useCollectionItems('customers');
  const properties = useCollectionItems('properties');
  const orders = useCollectionItems('orders');
  const reports = useCollectionItems('reports');

  const data = useCallback(
    (invoice: Invoice): InvoicePdfData => {
      const customer = customers.find((entry) => entry.id === invoice.customerId);
      const property = properties.find((entry) => entry.id === invoice.propertyId);
      const order = orders.find((entry) => entry.id === invoice.orderId);
      const report = reports.find((entry) => entry.id === invoice.reportId);
      const currency = invoice.currency || settings.currency;
      const totals = lineItemTotals(invoice.items);
      /** Rechnungsadresse, falls erfasst; sonst die Hauptadresse des Kunden. */
      const billing = customer?.billingAddress;
      const customerName = customer
        ? [customer.firstName, customer.name].filter(Boolean).join(' ')
        : '';

      return {
        number: invoice.number,
        title: invoice.title,
        date: formatDate(invoice.date, settings.language),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate, settings.language) : '',
        reportNumber: report?.number ?? '',
        orderLabel: order ? `${order.number} · ${order.title}` : '',
        propertyLabel: property?.name ?? '',
        customerName,
        billingLines: [
          billing?.name || customerName,
          ...addressLines(billing ?? customer?.address),
        ].filter(Boolean),
        items: invoice.items.map((item, index) => ({
          position: item.position || index + 1,
          description: item.description,
          quantity: `${item.quantity} ${item.unit}`.trim(),
          unitPrice: formatMoney(item.unitPrice, currency),
          vatRate: `${item.vatRate}%`,
          total: formatMoney(item.quantity * item.unitPrice, currency),
        })),
        net: formatMoney(totals.net, currency),
        vat: formatMoney(totals.vat, currency),
        gross: formatMoney(totals.gross, currency),
        notes: invoice.notes,
      };
    },
    [customers, orders, properties, reports, settings.currency, settings.language],
  );

  const labels = useCallback(
    (): InvoicePdfLabels => ({
      invoice: t('module.invoices.singular'),
      number: t('common.number'),
      date: t('common.date'),
      dueDate: t('invoice.dueDate'),
      report: t('module.reports.singular'),
      order: t('module.orders.singular'),
      property: t('module.properties.singular'),
      billTo: t('invoice.billTo'),
      position: t('tab.items'),
      description: t('common.description'),
      quantity: t('common.quantity'),
      price: t('common.price'),
      vat: t('invoice.vat'),
      total: t('common.total'),
      subtotal: t('invoice.subtotal'),
      grandTotal: t('invoice.grandTotal'),
      notes: t('common.notes'),
      vatNumber: t('settings.vatNumber'),
    }),
    [t],
  );

  const branding = useCallback((): InvoicePdfBranding => {
    const address = settings.companyAddress;
    return {
      companyName: settings.companyName || 'Facility365',
      companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', '),
      companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
      companyVat: settings.companyVat,
      logo: settings.companyLogo,
    };
  }, [settings]);

  return {
    data,
    download: (invoice) => downloadInvoicePdf(data(invoice), labels(), branding()),
    print: (invoice) => printInvoicePdf(data(invoice), labels(), branding()),
    fileName: (invoice) => invoicePdfFileName(data(invoice)),
  };
}
