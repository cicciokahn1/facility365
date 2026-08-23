'use client';

/**
 * Objektuebergabe bei Hauswartwechsel.
 *
 * Fuehrt fuer eine Liegenschaft zusammen, was uebergeben wird: Anlagen, offene
 * Auftraege und Schaeden, Wartungen, Schluessel, Dokumente und die naechsten
 * Termine. Eigene Daten entstehen nicht; alles stammt aus den Modulen.
 */
import { useMemo } from 'react';

import { useCollectionItems } from '@/lib/data/store';
import { documentExpiryState } from '@/lib/documents/expiry';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { today } from '@/lib/utils/format';
import { isDone } from '@/lib/workflow/complete';

export interface HandoverRow {
  id: string;
  href: string;
  number: string;
  title: string;
  /** Termin oder Stichdatum der Zeile; leer, wenn keines erfasst ist. */
  date: string;
  statusKey: TranslationKey;
  /** Freier Zusatz, z. B. Ort, Person oder Kategorie. */
  detail: string;
}

export interface HandoverSection {
  key: string;
  labelKey: TranslationKey;
  rows: HandoverRow[];
}

export interface HandoverFilter {
  propertyId: string;
  buildingId: string;
}

const atLocation = (filter: HandoverFilter, propertyId: string, buildingId: string): boolean => {
  if (filter.propertyId && filter.propertyId !== propertyId) return false;
  if (filter.buildingId && filter.buildingId !== buildingId) return false;
  return true;
};

export function useHandoverSections(filter: HandoverFilter): HandoverSection[] {
  const assets = useCollectionItems('assets');
  const orders = useCollectionItems('orders');
  const damages = useCollectionItems('damages');
  const maintenances = useCollectionItems('maintenances');
  const keys = useCollectionItems('keys');
  const documents = useCollectionItems('documents');
  const inspections = useCollectionItems('inspections');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const contracts = useCollectionItems('contracts');

  return useMemo(() => {
    const now = today();

    const assetRows: HandoverRow[] = assets
      .filter((asset) => atLocation(filter, asset.propertyId, asset.buildingId))
      .map((asset) => ({
        id: asset.id,
        href: `/assets/${asset.id}`,
        number: asset.number,
        title: asset.name || asset.number,
        date: asset.warrantyUntil,
        statusKey: `status.${asset.status}` as TranslationKey,
        detail: [asset.manufacturer, asset.location].filter(Boolean).join(' · '),
      }));

    const orderRows: HandoverRow[] = orders
      .filter(
        (order) =>
          !isDone('orders', order.status) &&
          atLocation(filter, order.propertyId, order.buildingId),
      )
      .map((order) => ({
        id: order.id,
        href: `/orders/${order.id}`,
        number: order.number,
        title: order.title || order.number,
        date: order.dueDate,
        statusKey: `status.${order.status}` as TranslationKey,
        detail: order.assignee,
      }));

    const damageRows: HandoverRow[] = damages
      .filter(
        (damage) =>
          !isDone('damages', damage.status) &&
          atLocation(filter, damage.propertyId, damage.buildingId),
      )
      .map((damage) => ({
        id: damage.id,
        href: `/damages/${damage.id}`,
        number: damage.number,
        title: damage.title || damage.number,
        date: damage.reportedAt,
        statusKey: `status.${damage.status}` as TranslationKey,
        detail: damage.reportedBy,
      }));

    const maintenanceRows: HandoverRow[] = maintenances
      .filter(
        (maintenance) =>
          !isDone('maintenances', maintenance.status) &&
          atLocation(filter, maintenance.propertyId, maintenance.buildingId),
      )
      .map((maintenance) => ({
        id: maintenance.id,
        href: `/maintenances/${maintenance.id}`,
        number: maintenance.number,
        title: maintenance.title || maintenance.number,
        date: maintenance.nextDate,
        statusKey: `status.${maintenance.status}` as TranslationKey,
        detail: maintenance.responsible || maintenance.company,
      }));

    const keyRows: HandoverRow[] = keys
      .filter((key) => atLocation(filter, key.propertyId, key.buildingId))
      .map((key) => ({
        id: key.id,
        href: `/keys/${key.id}`,
        number: key.keyNumber || key.number,
        title: key.title || key.number,
        date: key.issuedAt,
        statusKey: `keys.${key.status}` as TranslationKey,
        detail: [key.location, key.issuedTo].filter(Boolean).join(' · '),
      }));

    const documentRows: HandoverRow[] = documents
      .filter((document) => atLocation(filter, document.propertyId, document.buildingId))
      .map((document) => ({
        id: document.id,
        href: `/documents/${document.id}`,
        number: document.number,
        title: document.title || document.file?.name || document.number,
        date: document.validUntil,
        statusKey:
          documentExpiryState(document.validUntil, now) === 'expired'
            ? ('documents.expired' as TranslationKey)
            : ('documents.currentVersion' as TranslationKey),
        detail: document.category,
      }));

    /** Naechste Termine aus Kontrollen, Wartungen und Vertraegen. */
    const dateRows: HandoverRow[] = [
      ...inspections
        .filter(
          (check) =>
            check.status !== 'done' &&
            Boolean(check.nextDate) &&
            atLocation(filter, check.propertyId, check.buildingId),
        )
        .map((check) => ({
          id: `inspection-${check.id}`,
          href: `/inspections/${check.id}`,
          number: check.number,
          title: check.title || check.customType || check.number,
          date: check.nextDate,
          statusKey: 'module.inspections.singular' as TranslationKey,
          detail: check.tester,
        })),
      ...legionella
        .filter(
          (check) =>
            Boolean(check.nextDate) && atLocation(filter, check.propertyId, check.buildingId),
        )
        .map((check) => ({
          id: `legionella-${check.id}`,
          href: `/legionella/${check.id}`,
          number: check.number,
          title: check.title || check.system || check.number,
          date: check.nextDate,
          statusKey: 'module.legionella.singular' as TranslationKey,
          detail: check.responsible,
        })),
      ...rcd
        .filter(
          (check) =>
            check.status !== 'done' &&
            Boolean(check.nextDate) &&
            atLocation(filter, check.propertyId, check.buildingId),
        )
        .map((check) => ({
          id: `rcd-${check.id}`,
          href: `/rcd/${check.id}`,
          number: check.number,
          title: check.title || check.device || check.number,
          date: check.nextDate,
          statusKey: 'module.rcd.singular' as TranslationKey,
          detail: check.tester,
        })),
      ...contracts
        .filter(
          (contract) =>
            contract.status === 'active' &&
            Boolean(contract.end) &&
            atLocation(filter, contract.propertyId, contract.buildingId),
        )
        .map((contract) => ({
          id: `contract-${contract.id}`,
          href: `/contracts/${contract.id}`,
          number: contract.number,
          title: contract.title || contract.partner || contract.number,
          date: contract.end,
          statusKey: 'module.contracts.singular' as TranslationKey,
          detail: contract.partner,
        })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return [
      { key: 'assets', labelKey: 'module.assets' as TranslationKey, rows: assetRows },
      { key: 'orders', labelKey: 'handover.openOrders' as TranslationKey, rows: orderRows },
      { key: 'damages', labelKey: 'handover.openDamages' as TranslationKey, rows: damageRows },
      {
        key: 'maintenances',
        labelKey: 'handover.openMaintenances' as TranslationKey,
        rows: maintenanceRows,
      },
      { key: 'keys', labelKey: 'module.keys' as TranslationKey, rows: keyRows },
      { key: 'documents', labelKey: 'module.documents' as TranslationKey, rows: documentRows },
      { key: 'dates', labelKey: 'handover.dates' as TranslationKey, rows: dateRows },
    ];
  }, [
    assets,
    contracts,
    damages,
    documents,
    filter,
    inspections,
    keys,
    legionella,
    maintenances,
    orders,
    rcd,
  ]);
}
