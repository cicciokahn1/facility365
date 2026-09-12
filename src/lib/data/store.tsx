"use client";

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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { toast } from "sonner";

import { useAuth } from "@/lib/auth/provider";
import { currentActor } from "@/lib/data/actor";
import { ensureDailySnapshot } from "@/lib/data/backup";
import { COLLECTIONS } from "@/lib/data/collections";
import { NUMBER_PAD, NUMBER_PREFIX, emptyEntity } from "@/lib/data/factories";
import { describeChanges } from "@/lib/data/changes";
import {
  SyncState,
  offlineRepository,
  subscribeSync,
  syncState,
  watchConnection,
} from "@/lib/data/offline-repository";
import {
  Repository,
  StorageFullError,
  localRepository,
} from "@/lib/data/repository";
import { supabaseRepository } from "@/lib/data/supabase-repository";
import { sendWebhookEvent, webhookEventOf } from "@/lib/integrations/webhooks";
import { titleOfEntity } from "@/lib/module-config";
import {
  Activity,
  BaseEntity,
  CollectionKey,
  EntityOf,
  FieldChange,
} from "@/lib/types";
import { newId, nextNumber } from "@/lib/utils/id";

/**
 * Sammlungen mit unveraenderbarer Aktivitaetshistorie.
 *
 * Jede Anlage, Aenderung, Loeschung und Wiederherstellung wird zusaetzlich als
 * eigener Eintrag in `activities` festgehalten - dort wird nur angehaengt, nie
 * geaendert. Die Historie selbst fuehrt keine Historie.
 */
const TRACKED: CollectionKey[] = COLLECTIONS.filter(
  (key) => key !== "activities",
);

/** Häufig benötigte Stammdaten und Arbeitsvorgänge zuerst laden. */
const CORE_COLLECTIONS: CollectionKey[] = ([
  "users",
  "customers",
  "organizations",
  "sites",
  "properties",
  "buildings",
  "rooms",
  "assets",
  "orders",
  "tickets",
  "damages",
  "maintenances",
  "reports",
] satisfies CollectionKey[]).filter((key) => COLLECTIONS.includes(key));

const DEFERRED_COLLECTIONS = COLLECTIONS.filter(
  (key) => !CORE_COLLECTIONS.includes(key),
);

type Store = Record<CollectionKey, BaseEntity[]>;

interface IdleWindow {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
}

/** Arbeit ausserhalb des ersten Bildaufbaus ausfuehren. */
const whenIdle = (task: () => void): void => {
  if (typeof window === "undefined") {
    task();
    return;
  }
  const idle = (window as unknown as IdleWindow).requestIdleCallback;
  if (idle) idle(task, { timeout: 4000 });
  else window.setTimeout(task, 1200);
};

const emptyStore = (): Store =>
  COLLECTIONS.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as Store);

/** Ein einziger leerer Speicher: solange nichts geladen ist, bleibt die Referenz gleich. */
const EMPTY_STORE: Store = emptyStore();

interface DataContextValue {
  ready: boolean;
  /** Letzter Speicherfehler, z. B. voller Browser-Speicher. */
  storageError: boolean;
  setCollection: (collection: CollectionKey, items: BaseEntity[]) => void;
  saveItem: (collection: CollectionKey, item: BaseEntity) => void;
  /** Vorgang in der zentralen Aktivitaetshistorie festhalten. */
  logActivity: (
    collection: CollectionKey,
    entity: BaseEntity,
    action: string,
    changes?: FieldChange[],
  ) => void;
  removeItem: (collection: CollectionKey, id: string) => void;
  restoreItem: (collection: CollectionKey, id: string) => void;
  purgeItem: (collection: CollectionKey, id: string) => void;
  clearAll: () => void;
  /** Datenzugriff fuer Sicherung und Datenuebernahme. */
  repository: Repository;
  /** Stand neu aus der Ablage lesen, etwa nach einer Wiederherstellung. */
  reload: () => void;
  subscribe: (listener: () => void) => () => void;
  getStore: () => Store;
  getTrash: () => Store;
}

const DataContext = createContext<DataContextValue | null>(null);
const INDEX_CACHE = new WeakMap<BaseEntity[], Map<string, BaseEntity>>();

export function indexOf<T extends BaseEntity>(items: T[]): Map<string, T> {
  const cached = INDEX_CACHE.get(items);
  if (cached) return cached as Map<string, T>;
  const index = new Map(items.map((item) => [item.id, item]));
  INDEX_CACHE.set(items, index as Map<string, BaseEntity>);
  return index;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const [storageError, setStorageError] = useState(false);

  /**
   * Mit Anmeldung gegen die Datenbank, ohne Anmeldung lokal im Browser.
   *
   * Der Datenbankzugriff laeuft ueber die Offline-Schicht: sie spiegelt den
   * Stand auf dem Geraet und haelt Aenderungen ohne Verbindung zurueck.
   */
  const repository: Repository = useMemo(
    () =>
      auth.enabled ? offlineRepository(supabaseRepository) : localRepository,
    [auth.enabled],
  );
  /** Datenraum: Mandant und Konto, sonst das Geraet. */
  const scope =
    !auth.enabled
      ? "local"
      : auth.ready && auth.user && auth.membership
        ? `${auth.user.id}:${auth.membership.tenantId}`
        : "";
  const [loaded, setLoaded] = useState<{ scope: string; store: Store }>({
    scope: "",
    store: emptyStore(),
  });
  const [revision, setRevision] = useState(0);

  /** Nie Daten eines anderen Kontos zeigen, auch nicht kurz waehrend des Ladens. */
  const current = loaded.scope === scope && scope !== "";
  const all = current ? loaded.store : EMPTY_STORE;
  const ready = current;

  /**
   * Geloeschtes bleibt erhalten und wird nur ausgeblendet. Die Module sehen
   * unveraendert nur die gueltigen Datensaetze, der Papierkorb den Rest.
   */
  /** Ohne Papierkorbeintrag bleibt die vorhandene Liste bestehen - das spart Kopien und Neuzeichnen. */
  const store = useMemo(() => {
    if (all === EMPTY_STORE) return EMPTY_STORE;
    const next = emptyStore();
    for (const key of COLLECTIONS) {
      const items = all[key];
      next[key] = items.some((entry) => entry.deletedAt)
        ? items.filter((entry) => !entry.deletedAt)
        : items;
    }
    return next;
  }, [all]);

  const trash = useMemo(() => {
    if (all === EMPTY_STORE) return EMPTY_STORE;
    const next = emptyStore();
    for (const key of COLLECTIONS) {
      const items = all[key];
      next[key] = items.some((entry) => entry.deletedAt)
        ? items.filter((entry) => Boolean(entry.deletedAt))
        : EMPTY_STORE[key];
    }
    return next;
  }, [all]);
  const allRef = useRef(all);
  // eslint-disable-next-line react-hooks/refs -- aktueller Stand fuer stabile Rueckruffunktionen
  allRef.current = all;
  const snapshot = useRef({ store: EMPTY_STORE, trash: EMPTY_STORE });
  const listeners = useRef(new Set<() => void>());
  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);
  const getStore = useCallback(() => snapshot.current.store, []);
  const getTrash = useCallback(() => snapshot.current.trash, []);

  useLayoutEffect(() => {
    snapshot.current = { store, trash };
    listeners.current.forEach((listener) => listener());
  }, [store, trash]);

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    const load = async () => {
      const next = emptyStore();
      const read = async (keys: CollectionKey[]) => {
        await Promise.all(
          keys.map(async (key) => {
            next[key] = (await repository.read(key)) as BaseEntity[];
          }),
        );
      };
      try {
        await read(CORE_COLLECTIONS);
      } catch (error) {
        if (!cancelled)
          toast.error(error instanceof Error ? error.message : String(error));
      }
      if (cancelled) return;
      setLoaded({ scope, store: next });
      whenIdle(() => {
        void (async () => {
          try {
            await read(DEFERRED_COLLECTIONS);
            if (cancelled) return;
            setLoaded((state) => {
              if (state.scope !== scope) return state;
              return { scope, store: { ...state.store, ...next } };
            });
            /** Die Sicherung erst nach dem vollständigen Laden im Hintergrund erstellen. */
            void ensureDailySnapshot(next).catch(() => undefined);
          } catch (error) {
            if (!cancelled)
              toast.error(error instanceof Error ? error.message : String(error));
          }
        })();
      });
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [repository, revision, scope]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  /** Wartende Aenderungen gehen bei Rueckkehr der Verbindung von selbst raus. */
  useEffect(() => {
    if (!auth.enabled) return;
    return watchConnection(supabaseRepository, reload);
  }, [auth.enabled, reload]);

  const setStore = useCallback(
    (update: (current: Store) => Store) =>
      setLoaded((state) => ({
        scope: state.scope,
        store: update(state.store),
      })),
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
      const kept = allRef.current[collection].filter((entry) => entry.deletedAt);
      const written = [...items, ...kept];
      setStore((state) => ({ ...state, [collection]: written }));
      void repository
        .write(collection, written as EntityOf<typeof collection>[])
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

  /**
   * Aktivitaetseintrag anlegen.
   *
   * Der Eintrag wird nur angehaengt: er nennt Person, Zeitpunkt, Modul,
   * Datensatz, Handlung und - beim Aendern - die betroffenen Felder.
   */
  const issuedActivities = useRef<string[]>([]);
  const logActivity = useCallback(
    (
      collection: CollectionKey,
      entity: BaseEntity,
      action: string,
      changes?: FieldChange[],
    ) => {
      if (!TRACKED.includes(collection)) return;
      const activities = allRef.current.activities;
      issuedActivities.current = issuedActivities.current.filter(
        (number) => !activities.some((item) => item.number === number),
      );
      const actor = currentActor();
      const now = new Date().toISOString();
      const record: Activity = {
        ...emptyEntity("activities"),
        id: newId("activities"),
        number: nextNumber(
          NUMBER_PREFIX.activities,
          [
            ...activities.map((item) => item.number),
            ...issuedActivities.current,
          ],
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
        entityTitle: titleOfEntity(collection, entity),
        action,
        ...(changes && changes.length > 0 ? { changes } : {}),
      };
      issuedActivities.current.push(record.number);
      saveItem("activities", record);
      const event = webhookEventOf(action);
      if (event)
        sendWebhookEvent({
          event,
          module: collection,
          recordId: record.entityId,
          recordNumber: record.entityNumber,
          recordTitle: record.entityTitle,
          userId: record.userId,
          userName: record.userName,
          at: record.at,
          ...(changes && changes.length > 0
            ? {
                changes: changes.map((change) => ({
                  field: change.labelKey,
                  from: change.from,
                  to: change.to,
                })),
              }
            : {}),
        });
    },
    [saveItem],
  );

  /** Loeschen heisst Papierkorb: der Datensatz bleibt wiederherstellbar. */
  const moveTo = useCallback(
    (collection: CollectionKey, id: string, deletedAt: string | undefined) => {
      const entry = allRef.current[collection].find((item) => item.id === id);
      if (!entry) return;
      const next: BaseEntity = { ...entry, deletedAt };
      setStore((state) => ({
        ...state,
        [collection]: state[collection].map((item) =>
          item.id === id ? next : item,
        ),
      }));
      void repository
        .save(collection, next as EntityOf<typeof collection>)
        .then(() => setStorageError(false))
        .catch(report);
    },
    [repository, report, setStore],
  );

  const removeItem = useCallback(
    (collection: CollectionKey, id: string) =>
      moveTo(collection, id, new Date().toISOString()),
    [moveTo],
  );

  const restoreItem = useCallback(
    (collection: CollectionKey, id: string) => {
      const entry = allRef.current[collection].find((item) => item.id === id);
      if (entry) logActivity(collection, entry, "history.restored");
      moveTo(collection, id, undefined);
    },
    [logActivity, moveTo],
  );

  /** Endgueltig entfernen; nur aus dem Papierkorb heraus moeglich. */
  const purgeItem = useCallback(
    (collection: CollectionKey, id: string) => {
      const entry = allRef.current[collection].find((item) => item.id === id);
      /** Der Datensatz verschwindet, der Eintrag in der Historie bleibt. */
      if (entry) logActivity(collection, entry, "history.purged");
      setStore((state) => ({
        ...state,
        [collection]: state[collection].filter((entry) => entry.id !== id),
      }));
      void repository.removeOne(collection, id).catch(report);
    },
    [logActivity, repository, report, setStore],
  );

  const clearAll = useCallback(() => {
    void repository.clear().catch(report);
    setStore(() => emptyStore());
  }, [repository, report, setStore]);

  const value = useMemo<DataContextValue>(
    () => ({
      ready,
      storageError,
      setCollection,
      saveItem,
      logActivity,
      removeItem,
      restoreItem,
      purgeItem,
      clearAll,
      repository,
      reload,
      subscribe,
      getStore,
      getTrash,
    }),
    [
      getStore,
      getTrash,
      repository,
      reload,
      ready,
      storageError,
      setCollection,
      saveItem,
      logActivity,
      removeItem,
      restoreItem,
      purgeItem,
      clearAll,
      subscribe,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) throw new Error("DataProvider fehlt");
  return context;
};

export interface CollectionApi<K extends CollectionKey> {
  items: EntityOf<K>[];
  ready: boolean;
  get: (id: string) => EntityOf<K> | undefined;
  create: (values: Partial<EntityOf<K>>, user?: string) => EntityOf<K>;
  update: (
    id: string,
    values: Partial<EntityOf<K>>,
    action?: string,
    user?: string,
  ) => void;
  remove: (id: string) => void;
  replaceAll: (items: EntityOf<K>[]) => void;
}

/** Zugriff auf eine Sammlung inklusive Historie und laufender Nummer. */
export function useCollection<K extends CollectionKey>(
  collection: K,
): CollectionApi<K> {
  const { ready, setCollection, saveItem, removeItem, logActivity, getStore } =
    useData();
  const items = useCollectionItems(collection);
  const index = useEntityIndex(collection);
  /** Bereits vergebene Nummern, solange der neue Stand noch nicht angezeigt wird. */
  const issued = useRef<string[]>([]);

  const get = useCallback((id: string) => index.get(id), [index]);

  const create = useCallback(
    (values: Partial<EntityOf<K>>, user = currentActor().name || "System") => {
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
        history: [{ id: newId("h"), at: now, user, action: "history.created" }],
      } as EntityOf<K>;
      issued.current.push(entity.number);
      saveItem(collection, entity);
      logActivity(collection, entity, "history.created");
      return entity;
    },
    [collection, items, logActivity, saveItem],
  );

  const update = useCallback(
    (
      id: string,
      values: Partial<EntityOf<K>>,
      action = "history.updated",
      user = currentActor().name || "System",
    ) => {
      const now = new Date().toISOString();
      const current = index.get(id);
      if (!current) return;
      const merged = {
        ...current,
        ...values,
        /** Kennung, Nummer und Anlagedatum bleiben dauerhaft unveraendert. */
        id: current.id,
        number: current.number,
        createdAt: current.createdAt,
        updatedAt: now,
      } as BaseEntity;
      /** Welche Felder sich geaendert haben, steht in der Historie des Datensatzes. */
      const changes = describeChanges(
        collection,
        current as BaseEntity,
        merged,
        getStore(),
      );
      const next = {
        ...merged,
        history: [
          ...current.history,
          {
            id: newId("h"),
            at: now,
            user,
            action,
            ...(changes.length > 0 ? { changes } : {}),
          },
        ],
      };
      saveItem(collection, next as BaseEntity);
      logActivity(collection, next as BaseEntity, action, changes);
    },
    [collection, getStore, index, logActivity, saveItem],
  );

  const remove = useCallback(
    (id: string) => {
      const current = index.get(id);
      if (current) logActivity(collection, current, "history.deleted");
      removeItem(collection, id);
    },
    [collection, index, logActivity, removeItem],
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
  return indexOf(useCollectionItems(collection));
}

/** Nur-lesender Zugriff auf eine Sammlung, z. B. fuer Auswahllisten. */
export function useCollectionItems<K extends CollectionKey>(
  collection: K,
): EntityOf<K>[] {
  const { subscribe, getStore } = useData();
  return useSyncExternalStore(
    subscribe,
    () => getStore()[collection],
    () => EMPTY_STORE[collection],
  ) as EntityOf<K>[];
}

/** Alle Sammlungen auf einmal, z. B. um Verknuepfungen beim Excel-Import aufzuloesen. */
export const useAllCollections = (): Record<CollectionKey, BaseEntity[]> => {
  const { subscribe, getStore } = useData();
  return useSyncExternalStore(subscribe, getStore, () => EMPTY_STORE);
};

/** Papierkorb: geloeschte Datensaetze mit Wiederherstellung. */
export interface TrashApi {
  items: Record<CollectionKey, BaseEntity[]>;
  restore: (collection: CollectionKey, id: string) => void;
  purge: (collection: CollectionKey, id: string) => void;
}

export function useTrash(): TrashApi {
  const { subscribe, getTrash, restoreItem, purgeItem } = useData();
  const trash = useSyncExternalStore(subscribe, getTrash, () => EMPTY_STORE);
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
  const store = useAllCollections();
  const { items: trash } = useTrash();
  return useMemo(() => {
    const next = emptyStore();
    for (const key of COLLECTIONS) next[key] = [...store[key], ...trash[key]];
    return next;
  }, [store, trash]);
};

/**
 * Stand der Synchronisierung.
 *
 * Zeigt, ob eine Verbindung besteht, wie viele Aenderungen warten und wann
 * zuletzt uebertragen wurde.
 */
export const useSync = (): SyncState =>
  useSyncExternalStore(subscribeSync, syncState, syncState);

export const useStorageError = (): boolean => useData().storageError;
export const useDataReady = (): boolean => useData().ready;
export const useClearAllData = (): (() => void) => useData().clearAll;
