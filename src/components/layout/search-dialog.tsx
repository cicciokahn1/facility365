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
import { useT } from '@/lib/i18n/provider';
import { MODULES } from '@/lib/modules';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { CollectionKey } from '@/lib/types';

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
      const config = configOf(collection);
      const items = collections[collection];
      const matches = items
        .filter((item) => {
          if (!access.visible(collection, item)) return false;
          const searchOf = config.searchOf as (value: typeof item) => string;
          return searchOf(item).toLowerCase().includes(needle);
        })
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          number: item.number,
          title: titleOfEntity(collection, item),
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
            <CommandGroup key={group.collection} heading={t(moduleDef.labelKey)}>
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
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
