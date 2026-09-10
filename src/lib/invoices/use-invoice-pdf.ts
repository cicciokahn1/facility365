'use client';

/** Rechnungsdaten fuer das PDF sammeln, herunterladen und drucken. */
import { useCallback } from 'react';

import { lineItemTotals } from '@/components/module/line-item-editor';
import { logoOf } from '@/lib/branding/logo';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import type {
  InvoicePdfBranding,
  InvoicePdfData,
  InvoicePdfLabels,
} from '@/lib/invoices/invoice-pdf';
import { useSettings } from '@/lib/settings/provider';
import { Address, Invoice, InvoicePaymentData } from '@/lib/types';
import { referenceFor, swissQrPayload } from '@/lib/invoices/swiss-qr';
import { formatDate, formatMoney } from '@/lib/utils/format';

export interface InvoicePdfApi {
  data: (invoice: Invoice) => InvoicePdfData;
  download: (invoice: Invoice) => Promise<void>;
  print: (invoice: Invoice) => Promise<void>;
  fileName: (invoice: Invoice) => Promise<string>;
}

/** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
const pdfModule = () => import('@/lib/invoices/invoice-pdf');

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
  const quotes = useCollectionItems('quotes');
  const reports = useCollectionItems('reports');

  const data = useCallback(
    (invoice: Invoice): InvoicePdfData => {
      const customer = customers.find((entry) => entry.id === invoice.customerId);
      const property = properties.find((entry) => entry.id === invoice.propertyId);
      const order = orders.find((entry) => entry.id === invoice.orderId);
      const quote = quotes.find((entry) => entry.id === invoice.quoteId);
      const report = reports.find((entry) => entry.id === invoice.reportId);
      const currency = invoice.currency || settings.currency;
      const totals = lineItemTotals(invoice.items);
      /** Rechnungsadresse, falls erfasst; sonst die Hauptadresse des Kunden. */
      const billing = customer?.billingAddress;
      const customerName = customer
        ? [customer.firstName, customer.name].filter(Boolean).join(' ')
        : '';
      const payment: InvoicePaymentData = invoice.payment ?? {
        recipient: settings.paymentRecipient,
        address: settings.paymentAddress,
        iban: settings.paymentIban,
        qrIban: settings.paymentQrIban,
        bank: settings.paymentBank,
        bic: settings.paymentBic,
        referenceType: settings.paymentReferenceType,
      };
      const reference = invoice.qrReference || referenceFor(invoice.number, payment);
      const debtorLines = [
        customerName,
        ...addressLines(billing ?? customer?.address),
      ];
      const payload = payment.iban || payment.qrIban
        ? swissQrPayload(
            payment,
            debtorLines,
            totals.gross,
            currency,
            reference,
            invoice.number,
          )
        : '';

      return {
        number: invoice.number,
        title: invoice.title,
        date: formatDate(invoice.date, settings.language),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate, settings.language) : '',
        reportNumber: report?.number ?? '',
        orderLabel: order ? `${order.number} · ${order.title}` : '',
        quoteNumber: quote?.number ?? '',
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
        payment: {
          recipient: payment.recipient,
          addressLines: addressLines(payment.address),
          iban: payment.qrIban || payment.iban,
          bank: payment.bank,
          bic: payment.bic,
          reference,
          amount: formatMoney(totals.gross, currency),
          currency,
          payload,
        },
      };
    },
    [
      customers,
      orders,
      properties,
      quotes,
      reports,
      settings.currency,
      settings.language,
      settings.paymentAddress,
      settings.paymentBank,
      settings.paymentBic,
      settings.paymentIban,
      settings.paymentQrIban,
      settings.paymentRecipient,
      settings.paymentReferenceType,
    ],
  );

  const labels = useCallback(
    (): InvoicePdfLabels => ({
      invoice: t('module.invoices.singular'),
      number: t('common.number'),
      date: t('common.date'),
      dueDate: t('invoice.dueDate'),
      report: t('module.reports.singular'),
      order: t('module.orders.singular'),
      quote: t('module.quotes.singular'),
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
      payment: t('invoice.payment'),
      receipt: t('invoice.receipt'),
      account: t('invoice.account'),
      payableBy: t('invoice.payableBy'),
      reference: t('invoice.reference'),
      amount: t('invoice.amount'),
      currency: t('invoice.currency'),
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
      logo: logoOf(settings.companyLogo),
    };
  }, [settings]);

  return {
    data,
    download: async (invoice) => {
      const { downloadInvoicePdf } = await pdfModule();
      downloadInvoicePdf(data(invoice), labels(), branding());
    },
    print: async (invoice) => {
      const { printInvoicePdf } = await pdfModule();
      printInvoicePdf(data(invoice), labels(), branding());
    },
    fileName: async (invoice) => {
      const { invoicePdfFileName } = await pdfModule();
      return invoicePdfFileName(data(invoice));
    },
  };
}
