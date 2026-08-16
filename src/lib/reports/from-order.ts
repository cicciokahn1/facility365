'use client';

/**
 * Rapport aus einem Auftrag.
 *
 * Der Rapport uebernimmt Kunde, Objekt, Anlage, Datum, Taetigkeit, Zeiten,
 * Material, Fotos und Notizen; danach ist er ein eigener Datensatz und kann
 * unabhaengig vom Auftrag korrigiert werden.
 */
import { useCallback } from 'react';

import { useCollection } from '@/lib/data/store';
import { useCurrentUser } from '@/lib/settings/provider';
import { Order, Report } from '@/lib/types';
import { newId } from '@/lib/utils/id';
import { today } from '@/lib/utils/format';

/** Rapportwerte aus dem Auftrag; ohne Kennung und Nummer. */
export const reportValuesFromOrder = (order: Order): Partial<Report> => ({
  title: order.title,
  type: 'order',
  status: 'draft',
  date: order.workDate || order.completedAt.slice(0, 10) || today(),
  customerId: order.customerId,
  propertyId: order.propertyId,
  buildingId: order.buildingId,
  roomId: order.roomId,
  assetId: order.assetId,
  orderId: order.id,
  summary: order.description,
  workDescription: [
    order.description,
    ...order.checklist.filter((item) => item.done).map((item) => `• ${item.text}`),
  ]
    .filter(Boolean)
    .join('\n'),
  workStart: order.workStart,
  workEnd: order.workEnd,
  breakMinutes: order.breakMinutes,
  /** Material und Fotos werden kopiert, damit der Rapport eigenstaendig bleibt. */
  materials: order.materials.map((item) => ({ ...item, id: newId('mat') })),
  photos: order.photos.map((photo) => ({ ...photo, id: newId('pho') })),
  notes: order.notes,
});

export interface ReportFromOrderApi {
  /** Bestehender Rapport zum Auftrag, falls vorhanden. */
  existing: (orderId: string) => Report | undefined;
  create: (order: Order) => Report;
}

export function useReportFromOrder(): ReportFromOrderApi {
  const { items, create } = useCollection('reports');
  const user = useCurrentUser();

  const existing = useCallback(
    (orderId: string) => items.find((report) => report.orderId === orderId),
    [items],
  );

  const createFromOrder = useCallback(
    (order: Order) => {
      const values = reportValuesFromOrder(order);
      return create({ ...values, author: user }, user);
    },
    [create, user],
  );

  return { existing, create: createFromOrder };
}
