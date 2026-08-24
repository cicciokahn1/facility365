/**
 * Datenzugriff von Facility365.
 *
 * Die Oberflaeche kennt nur dieses Repository. Mit hinterlegtem Supabase-
 * Projekt liegen die Daten in PostgreSQL, getrennt je angemeldetem Benutzer;
 * ohne Projekt laeuft die Anwendung lokal im Browser weiter. Die Module
 * bleiben in beiden Faellen unveraendert.
 */
import { AppSettings, CollectionKey, EntityOf } from '@/lib/types';

export interface Repository {
  read<K extends CollectionKey>(collection: K): Promise<EntityOf<K>[]>;
  /** Einzelnen Datensatz anlegen oder aktualisieren. */
  save<K extends CollectionKey>(collection: K, item: EntityOf<K>): Promise<void>;
  removeOne(collection: CollectionKey, id: string): Promise<void>;
  /** Vollstaendiger Ersatz einer Sammlung, z. B. bei Massenaktionen. */
  write<K extends CollectionKey>(collection: K, items: EntityOf<K>[]): Promise<void>;
  readSettings(): Promise<Partial<AppSettings> | null>;
  writeSettings(settings: AppSettings): Promise<void>;
  clear(): Promise<void>;
}

const PREFIX = 'facility365.v2.';
const SETTINGS_KEY = `${PREFIX}settings`;

/** Fehler beim Schreiben, damit die Oberflaeche einen vollen Speicher melden kann. */
export class StorageFullError extends Error {
  constructor() {
    super('storage-full');
    this.name = 'StorageFullError';
  }
}

const parse = <T>(raw: string | null): T[] => {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
};

/**
 * Zuletzt gelesener oder geschriebener Stand je Sammlung.
 *
 * Ohne den Spiegel muesste jedes Speichern die ganze Sammlung erneut aus dem
 * Browserspeicher lesen und auswerten - auf dem Smartphone der teuerste Teil.
 */
const cache = new Map<CollectionKey, unknown[]>();

/**
 * Schreibvorgaenge je Sammlung nacheinander ausfuehren.
 *
 * Werden mehrere Datensaetze gleichzeitig angelegt, etwa beim Excel-Import,
 * wuerden sonst zwei Vorgaenge denselben Stand lesen und der erste ginge
 * verloren.
 */
const queues = new Map<CollectionKey, Promise<void>>();

const inOrder = (collection: CollectionKey, task: () => Promise<void>): Promise<void> => {
  const next = (queues.get(collection) ?? Promise.resolve()).then(task, task);
  queues.set(
    collection,
    next.catch(() => undefined),
  );
  return next;
};

export const localRepository: Repository = {
  async read<K extends CollectionKey>(collection: K): Promise<EntityOf<K>[]> {
    if (typeof window === 'undefined') return [];
    const cached = cache.get(collection);
    if (cached) return cached as EntityOf<K>[];
    const items = parse<EntityOf<K>>(window.localStorage.getItem(PREFIX + collection));
    cache.set(collection, items);
    return items;
  },

  async save<K extends CollectionKey>(collection: K, item: EntityOf<K>): Promise<void> {
    await inOrder(collection, async () => {
      const items = await localRepository.read(collection);
      const known = items.some((entry) => entry.id === item.id);
      const next = known
        ? items.map((entry) => (entry.id === item.id ? item : entry))
        : [...items, item];
      await localRepository.write(collection, next);
    });
  },

  async removeOne(collection: CollectionKey, id: string): Promise<void> {
    await inOrder(collection, async () => {
      const items = await localRepository.read(collection);
      await localRepository.write(
        collection,
        items.filter((entry) => entry.id !== id),
      );
    });
  },

  async write<K extends CollectionKey>(collection: K, items: EntityOf<K>[]): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFIX + collection, JSON.stringify(items));
      cache.set(collection, items);
    } catch {
      cache.delete(collection);
      throw new StorageFullError();
    }
  },

  async readSettings(): Promise<Partial<AppSettings> | null> {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Partial<AppSettings>;
    } catch {
      return null;
    }
  },

  async writeSettings(settings: AppSettings): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      throw new StorageFullError();
    }
  },

  async clear(): Promise<void> {
    cache.clear();
    if (typeof window === 'undefined') return;
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  },
};

/** Belegter Platz im lokalen Speicher in Bytes. */
export const storageUsage = (): number => {
  if (typeof window === 'undefined') return 0;
  let total = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    total += key.length + (window.localStorage.getItem(key)?.length ?? 0);
  }
  return total;
};

/** Browser geben rund 5 MB je Domain frei; der Puffer haelt Platz fuer Einstellungen frei. */
export const STORAGE_BUDGET = 4.4 * 1024 * 1024;

export const storageFree = (): number => Math.max(0, STORAGE_BUDGET - storageUsage());
