'use client';

/**
 * Verknuepfte Vorgaenge eines Datensatzes.
 *
 * Zusammengetragen wird beides: die Datensaetze, auf die ein Vorgang zeigt
 * (z. B. der Auftrag eines Rapports), und die Datensaetze, die auf ihn zeigen
 * (z. B. Rapporte, Rechnungen und Tickets eines Auftrags). Dazu kommt die
 * Herkunft aus einem anderen Modul. So ist jeder Datensatz ueber seine
 * Verknuepfungen in beide Richtungen zurueckverfolgbar.
 */
import { useMemo } from 'react';

import { useAccess } from '@/lib/auth/scope';
import { useAllCollections } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { sourceRefOf } from '@/lib/links/follow-up';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { isClosedStatus } from '@/lib/module-status';
import { moduleByCollection } from '@/lib/modules';
import { BaseEntity, CollectionKey } from '@/lib/types';

/** Module des Arbeitsprozesses; nur sie erscheinen als Verknuepfung. */
const WORKFLOW: CollectionKey[] = [
  'tickets',
  'orders',
  'damages',
  'maintenances',
  'inspections',
  'rcd',
  'legionella',
  'firechecks',
  'playgroundchecks',
  'cleaningtasks',
  'cleaningchecks',
  'cleaningcomplaints',
  'reports',
  'quotes',
  'invoices',
  'appointments',
  'contracts',
  'documents',
];

export interface LinkedRecord {
  key: string;
  collection: CollectionKey;
  id: string;
  number: string;
  title: string;
  status: string;
  done: boolean;
  path: string;
  /** Richtung: Herkunft, verknuepft oder daraus entstanden. */
  relation: 'source' | 'linked' | 'follow';
}

export interface LinkedRecords {
  source?: LinkedRecord;
  linked: LinkedRecord[];
  follow: LinkedRecord[];
}

/** Alle Verknuepfungen eines Datensatzes, in beide Richtungen. */
export function useLinkedRecords(
  collection: CollectionKey,
  entity: BaseEntity,
): LinkedRecords {
  const store = useAllCollections();
  const access = useAccess();

  return useMemo(() => {
    const entryOf = (
      target: CollectionKey,
      item: BaseEntity,
      relation: LinkedRecord['relation'],
    ): LinkedRecord => {
      const config = configOf(target);
      const status = config.statusField
        ? stringField(item, config.statusField)
        : '';
      return {
        key: `${relation}-${target}-${item.id}`,
        collection: target,
        id: item.id,
        number: item.number,
        title: titleOfEntity(target, item) || item.number,
        status,
        done: Boolean(status) && isClosedStatus(target, status),
        path: `${moduleByCollection(target).path}/${item.id}`,
        relation,
      };
    };

    const readable = (target: CollectionKey, item: BaseEntity): boolean =>
      access.canRead(target) &&
      !item.deletedAt &&
      access.visible(target, item);

    /** Herkunft: Datensatz, aus dem dieser Vorgang entstanden ist. */
    const ref = sourceRefOf(entity);
    let source: LinkedRecord | undefined;
    if (ref && access.canRead(ref.collection)) {
      const origin = store[ref.collection].find((item) => item.id === ref.id);
      if (origin && readable(ref.collection, origin)) {
        source = entryOf(ref.collection, origin, 'source');
      }
    }

    /** Verknuepft: Beziehungsfelder dieses Datensatzes auf andere Vorgaenge. */
    const linked: LinkedRecord[] = [];
    configOf(collection).fields.forEach((field) => {
      if (field.kind !== 'relation') return;
      if (!WORKFLOW.includes(field.collection)) return;
      const value = stringField(entity, field.name);
      if (!value) return;
      const target = store[field.collection].find((item) => item.id === value);
      if (target && readable(field.collection, target)) {
        linked.push(entryOf(field.collection, target, 'linked'));
      }
    });

    /** Entstanden: Vorgaenge, die auf diesen Datensatz zeigen. */
    const follow: LinkedRecord[] = [];
    WORKFLOW.forEach((target) => {
      if (!access.canRead(target)) return;
      const fields = configOf(target)
        .fields.filter(
          (field) => field.kind === 'relation' && field.collection === collection,
        )
        .map((field) => field.name);
      store[target].forEach((item) => {
        if (item.id === entity.id && target === collection) return;
        if (!readable(target, item)) return;
        const ownRef = sourceRefOf(item);
        const points =
          fields.some((name) => stringField(item, name) === entity.id) ||
          (ownRef?.collection === collection && ownRef.id === entity.id);
        if (points) follow.push(entryOf(target, item, 'follow'));
      });
    });

    return { source, linked, follow };
  }, [access, collection, entity, store]);
}
