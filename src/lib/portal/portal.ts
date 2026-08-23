'use client';

/**
 * Kundenportal.
 *
 * Fuehrt je Kunde zusammen, was fuer ihn freigegeben ist: seine Auftraege,
 * freigegebene Rapporte und Dokumente sowie seine Offerten. Eigene Daten
 * entstehen nicht; alles stammt aus den bestehenden Modulen.
 */
import { useMemo } from 'react';

import { useCollectionItems } from '@/lib/data/store';
import { TranslationKey } from '@/lib/i18n/dictionary';
import type { Quote } from '@/lib/types';

export interface PortalRow {
  id: string;
  href: string;
  number: string;
  title: string;
  date: string;
  statusKey: TranslationKey;
  detail: string;
}

export interface PortalQuoteRow extends PortalRow {
  status: Quote['status'];
  /** Offerte darf im Portal angenommen oder abgelehnt werden. */
  decidable: boolean;
  total: number;
  currency: string;
}

export interface PortalData {
  orders: PortalRow[];
  reports: PortalRow[];
  documents: PortalRow[];
  quotes: PortalQuoteRow[];
  empty: boolean;
}

const quoteTotal = (quote: Quote): number =>
  quote.items.reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0), 0);

export function usePortalData(customerId: string): PortalData {
  const orders = useCollectionItems('orders');
  const reports = useCollectionItems('reports');
  const documents = useCollectionItems('documents');
  const quotes = useCollectionItems('quotes');
  const properties = useCollectionItems('properties');

  return useMemo(() => {
    const propertyName = (id: string): string => {
      const property = properties.find((item) => item.id === id);
      return property ? property.name || property.number : '';
    };

    if (!customerId) {
      return { orders: [], reports: [], documents: [], quotes: [], empty: true };
    }

    const orderRows: PortalRow[] = orders
      .filter((order) => order.customerId === customerId)
      .map((order) => ({
        id: order.id,
        href: `/orders/${order.id}`,
        number: order.number,
        title: order.title || order.number,
        date: order.dueDate,
        statusKey: `status.${order.status}` as TranslationKey,
        detail: propertyName(order.propertyId),
      }));

    const reportRows: PortalRow[] = reports
      .filter((report) => report.customerId === customerId && report.sharedWithCustomer)
      .map((report) => ({
        id: report.id,
        href: `/reports/${report.id}`,
        number: report.number,
        title: report.title || report.number,
        date: report.date,
        statusKey: `status.${report.status}` as TranslationKey,
        detail: propertyName(report.propertyId),
      }));

    const documentRows: PortalRow[] = documents
      .filter((document) => document.customerId === customerId && document.sharedWithCustomer)
      .map((document) => ({
        id: document.id,
        href: `/documents/${document.id}`,
        number: document.number,
        title: document.title || document.number,
        date: document.validUntil,
        statusKey: 'portal.released' as TranslationKey,
        detail: [document.category, document.file?.type].filter(Boolean).join(' · '),
      }));

    const quoteRows: PortalQuoteRow[] = quotes
      .filter((quote) => quote.customerId === customerId && quote.status !== 'draft')
      .map((quote) => ({
        id: quote.id,
        href: `/quotes/${quote.id}`,
        number: quote.number,
        title: quote.title || quote.number,
        date: quote.date,
        statusKey: `status.${quote.status}` as TranslationKey,
        detail: propertyName(quote.propertyId),
        status: quote.status,
        decidable: quote.status === 'sent',
        total: quoteTotal(quote),
        currency: quote.currency || 'CHF',
      }));

    const empty =
      orderRows.length === 0 &&
      reportRows.length === 0 &&
      documentRows.length === 0 &&
      quoteRows.length === 0;

    return {
      orders: orderRows,
      reports: reportRows,
      documents: documentRows,
      quotes: quoteRows,
      empty,
    };
  }, [customerId, documents, orders, properties, quotes, reports]);
}
