'use client';

/**
 * Gemeinsamer Datenspeicher der Anwendung.
 *
 * Alle Module lesen und schreiben ueber `useCollection`. Die Historie eines
 * Datensatzes wird dabei automatisch fortgeschrieben, damit sich kein Modul
 * darum kuemmern muss.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/provider';
import { NUMBER_PAD, NUMBER_PREFIX, emptyEntity } from '@/lib/data/factories';
import { Repository, StorageFullError, localRepository } from '@/lib/data/repository';
import { supabaseRepository } from '@/lib/data/supabase-repository';
import { BaseEntity, CollectionKey, EntityOf } from '@/lib/types';
import { newId, nextNumber } from '@/lib/utils/id';

const COLLECTIONS: CollectionKey[] = [
  'customers',
  'suppliers',
  'organizations',
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

type Store = Record<CollectionKey, BaseEntity[]>;

const emptyStore = (): Store =>
  COLLECTIONS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as Store);

/** Ein einziger leerer Speicher: solange nichts geladen ist, bleibt die Referenz gleich. */
const EMPTY_STORE: Store = emptyStore();

interface DataContextValue {
  store: Store;
  ready: boolean;
  /** Letzter Speicherfehler, z. B. voller Browser-Speicher. */
  storageError: boolean;
  setCollection: (collection: CollectionKey, items: BaseEntity[]) => void;
  saveItem: (collection: CollectionKey, item: BaseEntity) => void;
  removeItem: (collection: CollectionKey, id: string) => void;
  clearAll: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [storageError, setStorageError] = useState(false);

  /** Mit Anmeldung gegen die Datenbank, ohne Anmeldung lokal im Browser. */
  const repository: Repository = auth.enabled ? supabaseRepository : localRepository;
  /** Datenraum: das Konto, sonst das Geraet. Wechselt er, gilt der alte Inhalt nicht mehr. */
  const scope = auth.enabled ? auth.user?.id ?? '' : 'local';
  const [loaded, setLoaded] = useState<{ scope: string; store: Store }>({
    scope: '',
    store: emptyStore(),
  });

  /** Nie Daten eines anderen Kontos zeigen, auch nicht kurz waehrend des Ladens. */
  const current = loaded.scope === scope && scope !== '';
  const store = current ? loaded.store : EMPTY_STORE;
  const ready = current;

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    const load = async () => {
      const next = emptyStore();
      try {
        await Promise.all(
          COLLECTIONS.map(async (key) => {
            next[key] = (await repository.read(key)) as BaseEntity[];
          }),
        );
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : String(error));
      }
      if (!cancelled) setLoaded({ scope, store: next });
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository, scope]);

  const setStore = useCallback(
    (update: (current: Store) => Store) =>
      setLoaded((state) => ({ scope: state.scope, store: update(state.store) })),
    [],
  );

  const report = useCallback((error: unknown) => {
    if (error instanceof StorageFullError) {
      setStorageError(true);
      return;
    }
    toast.error(error instanceof Error ? error.message : String(error));
  }, []);

  const setCollection = useCallback(
    (collection: CollectionKey, items: BaseEntity[]) => {
      setStore((state) => ({ ...state, [collection]: items }));
      void repository
        .write(collection, items as EntityOf<typeof collection>[])
        .then(() => setStorageError(false))
        .catch(report);
    },
    [repository, report, setStore],
  );

  const saveItem = useCallback(
    (collection: CollectionKey, item: BaseEntity) => {
      setStore((state) => {
        const items = state[collection];
        const known = items.some((entry) => entry.id === item.id);
        return {
          ...state,
          [collection]: known
            ? items.map((entry) => (entry.id === item.id ? item : entry))
            : [...items, item],
        };
      });
      void repository
        .save(collection, item as EntityOf<typeof collection>)
        .then(() => setStorageError(false))
        .catch(report);
    },
    [repository, report, setStore],
  );

  const removeItem = useCallback(
    (collection: CollectionKey, id: string) => {
      setStore((state) => ({
        ...state,
        [collection]: state[collection].filter((entry) => entry.id !== id),
      }));
      void repository.removeOne(collection, id).catch(report);
    },
    [repository, report, setStore],
  );

  const clearAll = useCallback(() => {
    void repository.clear().catch(report);
    setStore(() => emptyStore());
  }, [repository, report, setStore]);

  const value = useMemo<DataContextValue>(
    () => ({ store, ready, storageError, setCollection, saveItem, removeItem, clearAll }),
    [store, ready, storageError, setCollection, saveItem, removeItem, clearAll],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error('DataProvider fehlt');
  return context;
};

export interface CollectionApi<K extends CollectionKey> {
  items: EntityOf<K>[];
  ready: boolean;
  get: (id: string) => EntityOf<K> | undefined;
  create: (values: Partial<EntityOf<K>>, user?: string) => EntityOf<K>;
  update: (id: string, values: Partial<EntityOf<K>>, action?: string, user?: string) => void;
  remove: (id: string) => void;
  replaceAll: (items: EntityOf<K>[]) => void;
}

/** Zugriff auf eine Sammlung inklusive Historie und laufender Nummer. */
export function useCollection<K extends CollectionKey>(collection: K): CollectionApi<K> {
  const { store, ready, setCollection, saveItem, removeItem } = useData();
  const items = store[collection] as EntityOf<K>[];
  const index = useEntityIndex(collection);

  const get = useCallback((id: string) => index.get(id), [index]);

  const create = useCallback(
    (values: Partial<EntityOf<K>>, user = 'System') => {
      const now = new Date().toISOString();
      const entity = {
        ...emptyEntity(collection),
        ...values,
        id: newId(collection),
        number: nextNumber(
          NUMBER_PREFIX[collection],
          items.map((item) => item.number),
          NUMBER_PAD[collection],
        ),
        createdAt: now,
        updatedAt: now,
        history: [{ id: newId('h'), at: now, user, action: 'history.created' }],
      } as EntityOf<K>;
      saveItem(collection, entity);
      return entity;
    },
    [collection, items, saveItem],
  );

  const update = useCallback(
    (id: string, values: Partial<EntityOf<K>>, action = 'history.updated', user = 'System') => {
      const now = new Date().toISOString();
      const current = index.get(id);
      if (!current) return;
      const next = {
        ...current,
        ...values,
        /** Kennung, Nummer und Anlagedatum bleiben dauerhaft unveraendert. */
        id: current.id,
        number: current.number,
        createdAt: current.createdAt,
        updatedAt: now,
        history: [...current.history, { id: newId('h'), at: now, user, action }],
      };
      saveItem(collection, next as BaseEntity);
    },
    [collection, index, saveItem],
  );

  const remove = useCallback(
    (id: string) => removeItem(collection, id),
    [collection, removeItem],
  );

  const replaceAll = useCallback(
    (next: EntityOf<K>[]) => setCollection(collection, next as BaseEntity[]),
    [collection, setCollection],
  );

  return useMemo(
    () => ({ items, ready, get, create, update, remove, replaceAll }),
    [create, get, items, ready, remove, replaceAll, update],
  );
}

/** Nachschlagewerk einer Sammlung: Zugriff ueber die Kennung ohne Suchlauf. */
export function useEntityIndex<K extends CollectionKey>(
  collection: K,
): Map<string, EntityOf<K>> {
  const items = useCollectionItems(collection);
  return useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
}

/** Nur-lesender Zugriff auf eine Sammlung, z. B. fuer Auswahllisten. */
export function useCollectionItems<K extends CollectionKey>(collection: K): EntityOf<K>[] {
  const { store } = useData();
  return store[collection] as EntityOf<K>[];
}

export const useStorageError = (): boolean => useData().storageError;
export const useDataReady = (): boolean => useData().ready;
export const useClearAllData = (): (() => void) => useData().clearAll;
