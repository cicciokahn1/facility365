/**
 * Offline-Betrieb.
 *
 * Legt sich um den Datenzugriff der Datenbank: Gelesenes wird auf dem Geraet
 * gespiegelt, Aenderungen werden sofort lokal uebernommen und in eine
 * Warteschlange gelegt. Sobald die Verbindung wieder steht, wird die
 * Warteschlange der Reihe nach abgearbeitet. Nichts geht verloren - auch
 * dann nicht, wenn derselbe Datensatz zwischenzeitlich am Server geaendert
 * wurde: dann gilt der neuere Stand, der andere bleibt in der Historie
 * nachvollziehbar erhalten.
 */
import { describeChanges } from "@/lib/data/changes";
import { COLLECTIONS } from "@/lib/data/collections";
import { Repository } from "@/lib/data/repository";
import { workspacePrefix } from "@/lib/trial/trial";
import {
  AppSettings,
  BaseEntity,
  CollectionKey,
  EntityOf,
  HistoryEntry,
} from "@/lib/types";
import { newId } from "@/lib/utils/id";

/** Eigener Bereich: der Spiegel liegt neben, nicht in den Geraetedaten. */
const cacheKey = (collection: CollectionKey): string =>
  `${workspacePrefix()}sync.${collection}`;
const queueKey = (): string => `${workspacePrefix()}sync.queue`;

interface SaveOp {
  kind: "save";
  id: string;
  at: string;
  collection: CollectionKey;
  item: BaseEntity;
  attempts: number;
}

interface RemoveOp {
  kind: "remove";
  id: string;
  at: string;
  collection: CollectionKey;
  itemId: string;
  attempts: number;
}

interface WriteOp {
  kind: "write";
  id: string;
  at: string;
  collection: CollectionKey;
  items: BaseEntity[];
  attempts: number;
}

type QueuedOp = SaveOp | RemoveOp | WriteOp;

/** Nach so vielen erfolglosen Versuchen wartet der Vorgang auf den Benutzer. */
const MAX_ATTEMPTS = 5;

export interface SyncState {
  online: boolean;
  /** Noch nicht uebertragene Aenderungen. */
  pending: number;
  syncing: boolean;
  /** Zeitpunkt der letzten erfolgreichen Uebertragung. */
  lastSync: string;
  /** Mindestens ein Vorgang laesst sich dauerhaft nicht uebertragen. */
  failed: boolean;
}

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/** Der Spiegel ist Beiwerk: ist der Speicher voll, arbeitet die App ohne ihn weiter. */
const writeJson = (key: string, value: unknown): boolean => {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const readQueue = (): QueuedOp[] => readJson<QueuedOp[]>(queueKey(), []);

const listeners = new Set<() => void>();

let state: SyncState = {
  online: true,
  pending: 0,
  syncing: false,
  lastSync: "",
  failed: false,
};

const emit = () => listeners.forEach((listener) => listener());

const setState = (patch: Partial<SyncState>) => {
  const next = { ...state, ...patch };
  if (
    next.online === state.online &&
    next.pending === state.pending &&
    next.syncing === state.syncing &&
    next.lastSync === state.lastSync &&
    next.failed === state.failed
  ) {
    return;
  }
  state = next;
  emit();
};

const refreshPending = () => {
  const queue = readQueue();
  setState({
    pending: queue.length,
    failed: queue.some((op) => op.attempts >= MAX_ATTEMPTS),
  });
};

export const syncState = (): SyncState => state;

export const subscribeSync = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const isOnline = (): boolean =>
  typeof navigator === "undefined" ? true : navigator.onLine;

const enqueue = (op: QueuedOp) => {
  const queue = readQueue();
  /** Mehrfaches Speichern desselben Datensatzes ersetzt den Vorgaenger. */
  const trimmed =
    op.kind === "save"
      ? queue.filter(
          (entry) =>
            !(
              entry.kind === "save" &&
              entry.collection === op.collection &&
              entry.item.id === op.item.id
            ),
        )
      : queue;
  writeJson(queueKey(), [...trimmed, op]);
  refreshPending();
};

const dequeue = (id: string) => {
  writeJson(
    queueKey(),
    readQueue().filter((entry) => entry.id !== id),
  );
  refreshPending();
};

const countAttempt = (id: string) => {
  writeJson(
    queueKey(),
    readQueue().map((entry) =>
      entry.id === id ? { ...entry, attempts: entry.attempts + 1 } : entry,
    ),
  );
  refreshPending();
};

const cached = <K extends CollectionKey>(collection: K): EntityOf<K>[] =>
  readJson<EntityOf<K>[]>(cacheKey(collection), []);

const putCache = (collection: CollectionKey, items: BaseEntity[]) =>
  writeJson(cacheKey(collection), items);

const applyToCache = (collection: CollectionKey, item: BaseEntity) => {
  const items = cached(collection) as BaseEntity[];
  const known = items.some((entry) => entry.id === item.id);
  putCache(
    collection,
    known
      ? items.map((entry) => (entry.id === item.id ? item : entry))
      : [...items, item],
  );
};

const dropFromCache = (collection: CollectionKey, id: string) =>
  putCache(
    collection,
    (cached(collection) as BaseEntity[]).filter((entry) => entry.id !== id),
  );

/** Wartende Aenderungen ueber den Serverstand legen, damit die Oberflaeche sie zeigt. */
const withPending = <K extends CollectionKey>(
  collection: K,
  items: EntityOf<K>[],
): EntityOf<K>[] => {
  let result = items as BaseEntity[];
  for (const op of readQueue()) {
    if (op.collection !== collection) continue;
    if (op.kind === "save") {
      const known = result.some((entry) => entry.id === op.item.id);
      result = known
        ? result.map((entry) => (entry.id === op.item.id ? op.item : entry))
        : [...result, op.item];
    }
    if (op.kind === "remove")
      result = result.filter((entry) => entry.id !== op.itemId);
    if (op.kind === "write") result = op.items;
  }
  return result as EntityOf<K>[];
};

/** Bezeichnungen verknuepfter Datensaetze fuer den Konflikthinweis. */
const lookup = (): Partial<Record<CollectionKey, BaseEntity[]>> => {
  const store: Partial<Record<CollectionKey, BaseEntity[]>> = {};
  for (const key of COLLECTIONS) store[key] = cached(key) as BaseEntity[];
  return store;
};

const mergeHistory = (a: HistoryEntry[], b: HistoryEntry[]): HistoryEntry[] => {
  const known = new Map<string, HistoryEntry>();
  for (const entry of [...a, ...b]) known.set(entry.id, entry);
  return [...known.values()].sort((left, right) =>
    left.at.localeCompare(right.at),
  );
};

/**
 * Zwei Staende desselben Datensatzes zusammenfuehren.
 *
 * Es gilt der neuere Stand. Was der andere Stand anders hatte, wird als
 * Konflikt in der Historie festgehalten - so bleibt jede Eingabe sichtbar.
 */
const resolve = (
  collection: CollectionKey,
  mine: BaseEntity,
  theirs: BaseEntity,
): BaseEntity => {
  const mineWins = (mine.updatedAt || "") >= (theirs.updatedAt || "");
  const winner = mineWins ? mine : theirs;
  const loser = mineWins ? theirs : mine;
  const changes = describeChanges(collection, loser, winner, lookup());
  const history = mergeHistory(mine.history ?? [], theirs.history ?? []);
  return {
    ...winner,
    history:
      changes.length > 0
        ? [
            ...history,
            {
              id: newId("h"),
              at: new Date().toISOString(),
              user: loser.history?.[loser.history.length - 1]?.user ?? "",
              action: "history.conflict",
              changes,
            },
          ]
        : history,
  };
};

/** Erneuter Anlauf fuer Vorgaenge, die die Versuche aufgebraucht haben. */
export const resetAttempts = (): void => {
  writeJson(
    queueKey(),
    readQueue().map((entry) => ({ ...entry, attempts: 0 })),
  );
  refreshPending();
};

let flushing: Promise<void> | null = null;

/**
 * Warteschlange abarbeiten.
 *
 * Der Reihe nach, damit spaetere Aenderungen fruehere nicht ueberholen. Ein
 * fehlgeschlagener Vorgang bleibt erhalten und wird spaeter erneut versucht.
 */
export const flushQueue = async (remote: Repository): Promise<boolean> => {
  if (flushing) {
    await flushing;
    return state.pending === 0;
  }
  if (!isOnline() || readQueue().length === 0) return true;

  let changed = false;
  const run = async () => {
    setState({ syncing: true });
    try {
      for (const op of readQueue()) {
        if (op.attempts >= MAX_ATTEMPTS) continue;
        try {
          if (op.kind === "save") {
            const server = (await remote.read(op.collection)) as BaseEntity[];
            const theirs = server.find((entry) => entry.id === op.item.id);
            const merged = theirs
              ? resolve(op.collection, op.item, theirs)
              : op.item;
            await remote.save(op.collection, merged as EntityOf<CollectionKey>);
            applyToCache(op.collection, merged);
          } else if (op.kind === "remove") {
            await remote.removeOne(op.collection, op.itemId);
            dropFromCache(op.collection, op.itemId);
          } else {
            await remote.write(
              op.collection,
              op.items as EntityOf<CollectionKey>[],
            );
            putCache(op.collection, op.items);
          }
          dequeue(op.id);
          changed = true;
        } catch {
          countAttempt(op.id);
          if (!isOnline()) break;
        }
      }
      if (changed) setState({ lastSync: new Date().toISOString() });
    } finally {
      setState({ syncing: false });
      refreshPending();
    }
  };

  flushing = run();
  try {
    await flushing;
  } finally {
    flushing = null;
  }
  return state.pending === 0;
};

/** Datenzugriff mit Zwischenspeicher und Warteschlange. */
export const offlineRepository = (remote: Repository): Repository => ({
  async read<K extends CollectionKey>(collection: K): Promise<EntityOf<K>[]> {
    if (!isOnline()) return withPending(collection, cached(collection));
    try {
      const items = await remote.read(collection);
      putCache(collection, items as BaseEntity[]);
      return withPending(collection, items);
    } catch (error) {
      /** Ohne Spiegel bleibt nur der Fehler; mit Spiegel arbeitet die App weiter. */
      const mirror = cached(collection);
      if (mirror.length === 0) throw error;
      return withPending(collection, mirror);
    }
  },

  async save<K extends CollectionKey>(
    collection: K,
    item: EntityOf<K>,
  ): Promise<void> {
    applyToCache(collection, item as BaseEntity);
    if (isOnline()) {
      try {
        await remote.save(collection, item);
        return;
      } catch {
        /** Nichts geht verloren: der Vorgang wartet auf die naechste Verbindung. */
      }
    }
    enqueue({
      kind: "save",
      id: newId("op"),
      at: new Date().toISOString(),
      collection,
      item: item as BaseEntity,
      attempts: 0,
    });
  },

  async removeOne(collection: CollectionKey, id: string): Promise<void> {
    dropFromCache(collection, id);
    if (isOnline()) {
      try {
        await remote.removeOne(collection, id);
        return;
      } catch {
        /* siehe oben */
      }
    }
    enqueue({
      kind: "remove",
      id: newId("op"),
      at: new Date().toISOString(),
      collection,
      itemId: id,
      attempts: 0,
    });
  },

  async write<K extends CollectionKey>(
    collection: K,
    items: EntityOf<K>[],
  ): Promise<void> {
    putCache(collection, items as BaseEntity[]);
    if (isOnline()) {
      try {
        await remote.write(collection, items);
        return;
      } catch {
        /* siehe oben */
      }
    }
    enqueue({
      kind: "write",
      id: newId("op"),
      at: new Date().toISOString(),
      collection,
      items: items as BaseEntity[],
      attempts: 0,
    });
  },

  async readSettings(): Promise<Partial<AppSettings> | null> {
    if (!isOnline())
      return readJson<Partial<AppSettings> | null>(
        `${workspacePrefix()}sync.settings`,
        null,
      );
    try {
      const settings = await remote.readSettings();
      writeJson(`${workspacePrefix()}sync.settings`, settings);
      return settings;
    } catch {
      return readJson<Partial<AppSettings> | null>(
        `${workspacePrefix()}sync.settings`,
        null,
      );
    }
  },

  async writeSettings(settings: AppSettings): Promise<void> {
    writeJson(`${workspacePrefix()}sync.settings`, settings);
    if (!isOnline()) return;
    try {
      await remote.writeSettings(settings);
    } catch {
      /* Einstellungen folgen beim naechsten Speichern mit Verbindung. */
    }
  },

  async clear(): Promise<void> {
    await remote.clear();
    for (const key of COLLECTIONS) putCache(key, []);
    writeJson(queueKey(), []);
    refreshPending();
  },
});

/** Verbindungsstatus beobachten und bei Rueckkehr synchronisieren. */
export const watchConnection = (
  remote: Repository,
  onSynced: () => void,
): (() => void) => {
  if (typeof window === "undefined") return () => undefined;
  const update = () => {
    setState({ online: navigator.onLine });
    if (!navigator.onLine) return;
    void flushQueue(remote).then((done) => {
      if (done && state.lastSync) onSynced();
    });
  };
  refreshPending();
  setState({ online: navigator.onLine });
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  /** Auch bei Rueckkehr in die App pruefen: Mobilgeraete melden nicht jeden Wechsel. */
  const onVisible = () => {
    if (document.visibilityState === "visible") update();
  };
  document.addEventListener("visibilitychange", onVisible);
  /** Regelmaessig nachfassen, falls der Server kurzzeitig nicht erreichbar war. */
  const timer = window.setInterval(() => {
    if (state.pending > 0) update();
  }, 60_000);
  return () => {
    window.removeEventListener("online", update);
    window.removeEventListener("offline", update);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
  };
};
