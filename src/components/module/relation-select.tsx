'use client';

/** Auswahl eines verknuepften Datensatzes, z. B. Liegenschaft eines Gebaeudes. */
import { useMemo } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { titleOfEntity } from '@/lib/module-config';
import { BaseEntity, CollectionKey } from '@/lib/types';

const NONE = '__none__';

/** Wert eines Fremdschluessels eines Datensatzes, ohne den Typ zu verlieren. */
const parentValueOf = (entity: BaseEntity, key: string): string => {
  const value = (entity as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
};

export function RelationSelect({
  collection,
  value,
  onChange,
  placeholder,
  parentKey,
  parentValue,
  id,
}: {
  collection: CollectionKey;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Feldname im Ziel, ueber den eingeschraenkt wird. */
  parentKey?: string;
  parentValue?: string;
  id?: string;
}) {
  const t = useT();
  const items = useCollectionItems(collection);

  const options = useMemo(() => {
    const filtered =
      parentKey && parentValue
        ? items.filter((item) => parentValueOf(item, parentKey) === parentValue)
        : items;
    return filtered
      .map((item) => ({ id: item.id, label: titleOfEntity(collection, item), number: item.number }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, collection, parentKey, parentValue]);

  return (
    <Select value={value || NONE} onValueChange={(next) => onChange(next === NONE ? '' : next)}>
      <SelectTrigger id={id} className="w-full" data-testid={`relation-${collection}`}>
        <SelectValue placeholder={placeholder ?? t('common.select')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{t('common.none')}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Anzeigename eines verknuepften Datensatzes. */
export function useRelationLabel(collection: CollectionKey, id: string): string {
  const items = useCollectionItems(collection);
  const found = items.find((item) => item.id === id);
  return found ? titleOfEntity(collection, found) : '';
}
