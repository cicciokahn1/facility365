'use client';

/** Verknuepfte Datensaetze eines anderen Moduls, z. B. Auftraege eines Kunden. */
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import { CollectionKey } from '@/lib/types';

export function RelatedList({
  collection,
  field,
  value,
  /** Zusaetzlich erlaubte Werte, z. B. mehrere Liegenschaften eines Kunden. */
  values,
}: {
  collection: CollectionKey;
  field: string;
  value?: string;
  values?: string[];
}) {
  const items = useCollectionItems(collection);
  const config = configOf(collection);
  const moduleDef = moduleByCollection(collection);
  const allowed = values ?? (value ? [value] : []);
  const matches = items.filter(
    (item) => allowed.length > 0 && allowed.includes(stringField(item, field)),
  );

  if (matches.length === 0) return <EmptyState icon={moduleDef.icon} titleKey="list.empty" />;

  return (
    <ul className="divide-y rounded-xl border bg-card" data-testid={`related-${collection}`}>
      {matches.map((item) => (
        <li key={item.id}>
          <Link href={`${moduleDef.path}/${item.id}`} className="flex items-center gap-3 p-3">
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-xs text-muted-foreground">{item.number}</span>
              <span className="block truncate text-sm font-medium">
                {titleOfEntity(collection, item)}
              </span>
            </span>
            {config.statusField && config.statusOptions ? (
              <StatusBadge
                value={stringField(item, config.statusField)}
                options={config.statusOptions}
              />
            ) : null}
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
