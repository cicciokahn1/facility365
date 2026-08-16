'use client';

/**
 * Auftrag aus einer angenommenen Offerte.
 *
 * Uebernommen werden Kunde, Objekt, Titel, Einleitungstext und die Positionen:
 * die Offertpositionen werden zu Material des Auftrags und wandern von dort
 * ueber den Rapport bis in die Rechnung. Preise stammen aus der Offerte.
 */
import { useCallback } from 'react';

import { useCollection } from '@/lib/data/store';
import { Order, Quote } from '@/lib/types';
import { newId } from '@/lib/utils/id';
import { today } from '@/lib/utils/format';

/** Auftragswerte aus der Offerte; ohne Kennung und Nummer. */
export const orderValuesFromQuote = (quote: Quote): Partial<Order> => ({
  title: quote.title || quote.number,
  description: quote.introText,
  status: 'planned',
  customerId: quote.customerId,
  propertyId: quote.propertyId,
  quoteId: quote.id,
  workDate: quote.date || today(),
  /** Positionen werden kopiert, damit spaetere Offertaenderungen den Auftrag nicht verstellen. */
  materials: quote.items.map((item) => ({
    id: newId('mat'),
    name: item.description,
    quantity: item.quantity,
    unit: item.unit,
    price: item.unitPrice,
  })),
});

export interface OrderFromQuoteApi {
  /** Bestehender Auftrag zur Offerte, falls vorhanden. */
  existing: (quoteId: string) => Order | undefined;
  create: (quote: Quote) => Order;
}

export function useOrderFromQuote(): OrderFromQuoteApi {
  const { items, create } = useCollection('orders');

  const existing = useCallback(
    (quoteId: string) => items.find((order) => order.quoteId === quoteId),
    [items],
  );

  const createFromQuote = useCallback(
    (quote: Quote) => create(orderValuesFromQuote(quote)),
    [create],
  );

  return { existing, create: createFromQuote };
}
