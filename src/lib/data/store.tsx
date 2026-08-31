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
  useRef,
  useState,
} from 'react';

import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/provider';
import { currentActor } from '@/lib/data/actor';
import { ensureDailySnapshot } from '@/lib/data/backup';
import { COLLECTIONS } from '@/lib/data/collections';
import { NUMBER_PAD, NUMBER_PREFIX, emptyEntity } from '@/lib/data/factories';
import { Repository, StorageFullError, localRepository } from '@/lib/data/repository';
import { supabaseRepository } from '@/lib/data/supabase-repository';
import { titleOfEntity } from '@/lib/module-config';
import { Activity, BaseEntity, CollectionKey, EntityOf } from '@/lib/types';
import { newId, nextNumber } from '@/lib/utils/id';


/**
 * Sammlungen mit unveraenderbarer Aktivitaetshistorie.
 *
 * Jede Anlage, Aenderung und Loeschung wird zusaetzlich als eigener Eintrag in
 * `activities` festgehalten - dort wird nur angehaengt, nie geaendert.
 */
const TRACKED: CollectionKey[] = [
  'inspections',
  'playgroundchecks',
  'orders',
  'maintenances',
  'damages',
  'assets',
  'documents',
  'reports',
  'cleaningtasks',
  'quotes',
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
  /** Datensaetze im Papierkorb je Sammlung. */
  trash: Store;
  restoreItem: (collection: CollectionKey, id: string) => void;
  purgeItem: (collection: CollectionKey, id: string) => void;
  clearAll: () => void;
  /** Datenzugriff fuer Sicherung und Datenuebernahme. */
  repository: Repository;
  /** Stand neu aus der Ablage lesen, etwa nach einer Wiederherstellung. */
  reload: () => void;
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
  const [revision, setRevision] = useState(0);

  /** Nie Daten eines anderen Kontos zeigen, auch nicht kurz waehrend des Ladens. */
  const current = loaded.scope === scope && scope !== '';
  const all = current ? loaded.store : EMPTY_STORE;
  const ready = current;

  /**
   * Geloeschtes bleibt erhalten und wird nur ausgeblendet. Die Module sehen
   * unveraendert nur die gueltigen Datensaetze, der Papierkorb den Rest.
   */
  const store = useMemo(() => {
    if (all === EMPTY_STORE) return EMPTY_STORE;
    const next = emptyStore();
    for (const key of COLLECTIONS) next[key] = all[key].filter((entry) => !entry.deletedAt);
    return next;
  }, [all]);

  const trash = useMemo(() => {
    if (all === EMPTY_STORE) return EMPTY_STORE;
    const next = emptyStore();
    for (const key of COLLECTIONS) next[key] = all[key].filter((entry) => Boolean(entry.deletedAt));
    return next;
  }, [all]);

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
      if (cancelled) return;
      setLoaded({ scope, store: next });
      /** Taegliche Sicherung; scheitert sie, bleibt der Betrieb unberuehrt. */
      void ensureDailySnapshot(next).catch(() => undefined);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository, revision, scope]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

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
      /** Der Papierkorb bleibt unberuehrt, auch wenn eine ganze Liste ersetzt wird. */
      const kept = all[collection].filter((entry) => entry.deletedAt);
      const written = [...items, ...kept];
      setStore((state) => ({ ...state, [collection]: written }));
      void repository
        .write(collection, written as EntityOf<typeof collection>[])
        .then(() => setStorageError(false))
        .catch(report);
    },
    [all, repository, report, setStore],
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

  /** Loeschen heisst Papierkorb: der Datensatz bleibt wiederherstellbar. */
  const moveTo = useCallback(
    (collection: CollectionKey, id: string, deletedAt: string | undefined) => {
      const entry = all[collection].find((item) => item.id === id);
      if (!entry) return;
      const next: BaseEntity = { ...entry, deletedAt };
      setStore((state) => ({
        ...state,
        [collection]: state[collection].map((item) => (item.id === id ? next : item)),
      }));
      void repository
        .save(collection, next as EntityOf<typeof collection>)
        .then(() => setStorageError(false))
        .catch(report);
    },
    [all, repository, report, setStore],
  );

  const removeItem = useCallback(
    (collection: CollectionKey, id: string) =>
      moveTo(collection, id, new Date().toISOString()),
    [moveTo],
  );

  const restoreItem = useCallback(
    (collection: CollectionKey, id: string) => moveTo(collection, id, undefined),
    [moveTo],
  );

  /** Endgueltig entfernen; nur aus dem Papierkorb heraus moeglich. */
  const purgeItem = useCallback(
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
    () => ({
      store,
      trash,
      ready,
      storageError,
      setCollection,
      saveItem,
      removeItem,
      restoreItem,
      purgeItem,
      clearAll,
      repository,
      reload,
    }),
    [
      repository,
      reload,
      store,
      trash,
      ready,
      storageError,
      setCollection,
      saveItem,
      removeItem,
      restoreItem,
      purgeItem,
      clearAll,
    ],
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
  /** Bereits vergebene Nummern, solange der neue Stand noch nicht angezeigt wird. */
  const issued = useRef<string[]>([]);

  const get = useCallback((id: string) => index.get(id), [index]);

  const activities = store.activities;
  const issuedActivities = useRef<string[]>([]);
  const log = useCallback(
    (entity: BaseEntity, action: string, title: string) => {
      if (!TRACKED.includes(collection)) return;
      issuedActivities.current = issuedActivities.current.filter(
        (number) => !activities.some((item) => item.number === number),
      );
      const actor = currentActor();
      const now = new Date().toISOString();
      const record: Activity = {
        ...emptyEntity('activities'),
        id: newId('activities'),
        number: nextNumber(
          NUMBER_PREFIX.activities,
          [...activities.map((item) => item.number), ...issuedActivities.current],
          NUMBER_PAD.activities,
        ),
        createdAt: now,
        updatedAt: now,
        at: now,
        userId: actor.id,
        userName: actor.name,
        module: collection,
        entityId: entity.id,
        entityNumber: entity.number,
        entityTitle: title,
        action,
      };
      issuedActivities.current.push(record.number);
      saveItem('activities', record);
    },
    [activities, collection, saveItem],
  );

  const create = useCallback(
    (values: Partial<EntityOf<K>>, user = currentActor().name || 'System') => {
      issued.current = issued.current.filter(
        (number) => !items.some((item) => item.number === number),
      );
      const now = new Date().toISOString();
      const entity = {
        ...emptyEntity(collection),
        ...values,
        id: newId(collection),
        number: nextNumber(
          NUMBER_PREFIX[collection],
          [...items.map((item) => item.number), ...issued.current],
          NUMBER_PAD[collection],
        ),
        createdAt: now,
        updatedAt: now,
        history: [{ id: newId('h'), at: now, user, action: 'history.created' }],
      } as EntityOf<K>;
      issued.current.push(entity.number);
      saveItem(collection, entity);
      log(entity, 'history.created', titleOfEntity(collection, entity));
      return entity;
    },
    [collection, items, log, saveItem],
  );

  const update = useCallback(
    (
      id: string,
      values: Partial<EntityOf<K>>,
      action = 'history.updated',
      user = currentActor().name || 'System',
    ) => {
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
      log(next as BaseEntity, action, titleOfEntity(collection, next as BaseEntity));
    },
    [collection, index, log, saveItem],
  );

  const remove = useCallback(
    (id: string) => {
      const current = index.get(id);
      if (current) log(current, 'history.deleted', titleOfEntity(collection, current));
      removeItem(collection, id);
    },
    [collection, index, log, removeItem],
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

/** Alle Sammlungen auf einmal, z. B. um Verknuepfungen beim Excel-Import aufzuloesen. */
export const useAllCollections = (): Record<CollectionKey, BaseEntity[]> => useData().store;

/** Papierkorb: geloeschte Datensaetze mit Wiederherstellung. */
export interface TrashApi {
  items: Record<CollectionKey, BaseEntity[]>;
  restore: (collection: CollectionKey, id: string) => void;
  purge: (collection: CollectionKey, id: string) => void;
}

export function useTrash(): TrashApi {
  const { trash, restoreItem, purgeItem } = useData();
  return useMemo(
    () => ({ items: trash, restore: restoreItem, purge: purgeItem }),
    [purgeItem, restoreItem, trash],
  );
}

/** Datenzugriff fuer Sicherung, Wiederherstellung und Datenuebernahme. */
export const useRepository = (): Repository => useData().repository;

/** Alle Sammlungen neu aus der Ablage lesen. */
export const useReloadData = (): (() => void) => useData().reload;

/** Alle Datensaetze inklusive Papierkorb, z. B. fuer eine vollstaendige Sicherung. */
export const useCompleteStore = (): Record<CollectionKey, BaseEntity[]> => {
  const { store, trash } = useData();
  return useMemo(() => {
    const next = emptyStore();
    for (const key of COLLECTIONS) next[key] = [...store[key], ...trash[key]];
    return next;
  }, [store, trash]);
};

export const useStorageError = (): boolean => useData().storageError;
export const useDataReady = (): boolean => useData().ready;
export const useClearAllData = (): (() => void) => useData().clearAll;
