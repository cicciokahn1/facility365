'use client';

/** Globale Suche ueber alle Module (Tastenkuerzel Strg/Cmd + K). */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { MODULES } from '@/lib/modules';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { CollectionKey } from '@/lib/types';

const SEARCHABLE: CollectionKey[] = [
  'customers',
  'suppliers',
  'sites',
  'properties',
  'buildings',
  'rooms',
  'assets',
  'documents',
  'energy',
  'orders',
  'maintenances',
  'legionella',
  'rcd',
  'keys',
  'stock',
  'contracts',
  'damages',
  'reports',
  'quotes',
  'invoices',
  'cleaningareas',
  'cleaners',
  'cleaningplans',
  'cleaningtasks',
  'cleaningchecks',
  'cleaningcomplaints',
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        data-testid="global-search-trigger"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground"
      >
        <Search className="size-4" aria-hidden />
        <span className="truncate">{t('list.searchPlaceholder')}</span>
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} onSelect={(path) => router.push(path)} />
    </>
  );
}

function SearchDialog({
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
  const customers = useCollectionItems('customers');
  const suppliers = useCollectionItems('suppliers');
  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const documents = useCollectionItems('documents');
  const energy = useCollectionItems('energy');
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');
  const legionella = useCollectionItems('legionella');
  const rcd = useCollectionItems('rcd');
  const keys = useCollectionItems('keys');
  const stock = useCollectionItems('stock');
  const contracts = useCollectionItems('contracts');
  const damages = useCollectionItems('damages');
  const reports = useCollectionItems('reports');
  const quotes = useCollectionItems('quotes');
  const invoices = useCollectionItems('invoices');
  const cleaningareas = useCollectionItems('cleaningareas');
  const cleaners = useCollectionItems('cleaners');
  const cleaningplans = useCollectionItems('cleaningplans');
  const cleaningtasks = useCollectionItems('cleaningtasks');
  const cleaningchecks = useCollectionItems('cleaningchecks');
  const cleaningcomplaints = useCollectionItems('cleaningcomplaints');

  const collections = useMemo(
    () => ({
      customers,
      suppliers,
      sites,
      properties,
      buildings,
      rooms,
      assets,
      documents,
      energy,
      orders,
      maintenances,
      legionella,
      rcd,
      keys,
      stock,
      contracts,
      damages,
      reports,
      quotes,
      invoices,
      cleaningareas,
      cleaners,
      cleaningplans,
      cleaningtasks,
      cleaningchecks,
      cleaningcomplaints,
    }),
    [
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
      documents,
      energy,
      invoices,
      keys,
      legionella,
      maintenances,
      orders,
      properties,
      quotes,
      rcd,
      reports,
      rooms,
      sites,
      stock,
      suppliers,
    ],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!open || !needle) return [];
    return SEARCHABLE.map((collection) => {
      const config = configOf(collection);
      const items = collections[collection];
      const matches = items
        .filter((item) => {
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
  }, [collections, open, query]);

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
