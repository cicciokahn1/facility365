'use client';

/** Inhalt der globalen Suche; wird erst beim Oeffnen geladen. */
import { useDeferredValue, useMemo, useState } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAccess } from '@/lib/auth/scope';
import { useCollectionItems } from '@/lib/data/store';
import { fieldValue } from '@/lib/entity-values';
import { useT } from '@/lib/i18n/provider';
import { MODULES } from '@/lib/modules';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { BaseEntity, CollectionKey } from '@/lib/types';

const SEARCHABLE = [

  'customers',
  'suppliers',
  'sources',
  'appointments',
  'organizations',
  'sites',
  'properties',
  'buildings',
  'rooms',
  'assets',
  'documents',
  'energy',
  'solarplants',
  'solaryields',
  'orders',
  'maintenances',
  'legionella',
  'rcd',
  'inspections',
  'playgroundchecks',
  'firechecks',
  'keys',
  'inventory',
  'vehicles',
  'tools',
  'stock',
  'contracts',
  'damages',
  'tickets',
  'reports',
  'quotes',
  'invoices',
  'cleaningareas',
  'cleaners',
  'cleaningplans',
  'cleaningtasks',
  'cleaningchecks',
  'cleaningcomplaints',
  'users',
] as const satisfies readonly CollectionKey[];

const SEARCH_SKIP_KEYS = new Set(['url', 'history', 'signature', 'data']);

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const collectSearchValues = (
  value: unknown,
  values: string[],
  key = '',
  depth = 0,
): void => {
  if (depth > 3 || value === null || value === undefined) return;
  if (typeof value === 'string' || typeof value === 'number') {
    if (value && !SEARCH_SKIP_KEYS.has(key)) values.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSearchValues(entry, values, key, depth + 1));
    return;
  }
  if (typeof value !== 'object') return;
  Object.entries(value).forEach(([childKey, childValue]) => {
    if (!SEARCH_SKIP_KEYS.has(childKey)) {
      collectSearchValues(childValue, values, childKey, depth + 1);
    }
  });
};

const addressCityOf = (item: BaseEntity): string => {
  const address = fieldValue(item, 'address');
  if (typeof address !== 'object' || address === null) return '';
  const city = (address as { city?: unknown }).city;
  return typeof city === 'string' ? city : '';
};

const searchTextOf = (
  collection: CollectionKey,
  item: BaseEntity,
): string => {
  const values: string[] = [];
  const config = configOf(collection);
  collectSearchValues(item, values);
  values.push((config.searchOf as (value: BaseEntity) => string)(item));
  return normalizeSearchText(values.join(' '));
};

const matchesSearch = (text: string, query: string): boolean => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return false;
  const compactText = text.replaceAll(' ', '');
  const compactQuery = normalizedQuery.replaceAll(' ', '');
  return (
    normalizedQuery.split(' ').every((token) => text.includes(token)) ||
    compactText.includes(compactQuery)
  );
};

export function SearchDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const access = useAccess();
  const customers = useCollectionItems('customers');
  const suppliers = useCollectionItems('suppliers');
  const sources = useCollectionItems('sources');
  const appointments = useCollectionItems('appointments');
  const organizations = useCollectionItems('organizations');
  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const documents = useCollectionItems('documents');
  const energy = useCollectionItems('energy');
  const solarplants = useCollectionItems('solarplants');
  const solaryields = useCollectionItems('solaryields');
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const inspections = useCollectionItems('inspections');
  const playgroundchecks = useCollectionItems('playgroundchecks');
  const firechecks = useCollectionItems('firechecks');
  const keys = useCollectionItems('keys');
  const inventory = useCollectionItems('inventory');
  const vehicles = useCollectionItems('vehicles');
  const tools = useCollectionItems('tools');
  const stock = useCollectionItems('stock');
  const contracts = useCollectionItems('contracts');
  const damages = useCollectionItems('damages');
  const tickets = useCollectionItems('tickets');
  const reports = useCollectionItems('reports');
  const quotes = useCollectionItems('quotes');
  const invoices = useCollectionItems('invoices');
  const cleaningareas = useCollectionItems('cleaningareas');
  const cleaners = useCollectionItems('cleaners');
  const cleaningplans = useCollectionItems('cleaningplans');
  const cleaningtasks = useCollectionItems('cleaningtasks');
  const cleaningchecks = useCollectionItems('cleaningchecks');
  const cleaningcomplaints = useCollectionItems('cleaningcomplaints');
  const users = useCollectionItems('users');

  const collections = useMemo(
    () => ({
      customers,
      suppliers,
      sources,
      appointments,
      organizations,
      sites,
      properties,
      buildings,
      rooms,
      assets,
      documents,
      energy,
      solarplants,
      solaryields,
      orders,
      maintenances,
      legionella,
      rcd,
      inspections,
      playgroundchecks,
      firechecks,
      keys,
      inventory,
      vehicles,
      tools,
      stock,
      contracts,
      damages,
      tickets,
      reports,
      quotes,
      invoices,
      cleaningareas,
      cleaners,
      cleaningplans,
      cleaningtasks,
      cleaningchecks,
      cleaningcomplaints,
      users,
    }),
    [
      appointments,
      assets,
      buildings,
      cleaners,
      cleaningareas,
      cleaningchecks,
      cleaningcomplaints,
      cleaningplans,
      cleaningtasks,
      contracts,
      customers,
      damages,
      tickets,
      documents,
      energy,
      firechecks,
      inspections,
      inventory,
      invoices,
      keys,
      legionella,
      maintenances,
      orders,
      organizations,
      playgroundchecks,
      properties,
      quotes,
      rcd,
      reports,
      rooms,
      sites,
      solarplants,
      solaryields,
      sources,
      stock,
      suppliers,
      tools,
      users,
      vehicles,
    ],
  );

  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!open || !needle) return [];
    return SEARCHABLE.filter((collection) => access.canRead(collection)).map((collection) => {
      const items = collections[collection];
      const matches = items
        .filter((item) => {
          if (!access.visible(collection, item)) return false;
          return matchesSearch(searchTextOf(collection, item), needle);
        })
        .slice(0, 8)
        .map((item) => ({
          id: item.id,
          number: item.number,
          title: titleOfEntity(collection, item),
          detail: addressCityOf(item),
        }));
      return { collection, matches };
    }).filter((group) => group.matches.length > 0);
  }, [access, collections, deferredQuery, open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder={t('list.searchPlaceholder')}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{query ? t('list.noSearchResults') : t('action.search')}</CommandEmpty>
        {results.map((group) => {
          const moduleDef = MODULES.find((entry) => entry.key === group.collection);
          if (!moduleDef) return null;
          return (
            <CommandGroup
              key={group.collection}
              heading={`${t(moduleDef.labelKey)} (${group.matches.length})`}
            >
              {group.matches.map((match) => (
                <CommandItem
                  key={match.id}
                  value={`${group.collection}-${match.id}`}
                  onSelect={() => {
                    onOpenChange(false);
                    setQuery('');
                    onSelect(`${moduleDef.path}/${match.id}`);
                  }}
                  >
                  <span className="font-mono text-xs text-muted-foreground">{match.number}</span>
                  <span className="truncate">{match.title}</span>
                  {match.detail ? (
                    <span className="truncate text-xs text-muted-foreground">{match.detail}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
