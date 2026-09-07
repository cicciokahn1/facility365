/**
 * Favoriten und zuletzt verwendete Datensaetze.
 *
 * Gespeichert werden nur Verweise (Sammlung und Kennung) - kein Datensatz wird
 * kopiert. Die Merkliste gehoert dem angemeldeten Benutzer und liegt auf dem
 * Geraet; sie beeinflusst weder die Daten noch die Rechte eines Moduls.
 */
import { workspacePrefix } from "@/lib/trial/trial";
import { CollectionKey } from "@/lib/types";

export interface EntityRef {
  collection: CollectionKey;
  id: string;
  /** Zeitpunkt der Markierung bzw. des letzten Aufrufs. */
  at: string;
}

interface Marks {
  favorites: EntityRef[];
  recents: EntityRef[];
}

/** Mehr zuletzt verwendete Eintraege sind unuebersichtlich und unnoetig. */
const RECENT_LIMIT = 20;

export const EMPTY_MARKS: Marks = { favorites: [], recents: [] };

const listeners = new Set<() => void>();
const cache = new Map<string, Marks>();

const storageKey = (scope: string): string =>
  `${workspacePrefix()}marks.${scope}`;

const isRef = (value: unknown): value is EntityRef => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<EntityRef>;
  return typeof entry.collection === "string" && typeof entry.id === "string";
};

const parse = (raw: string | null): Marks => {
  if (!raw) return EMPTY_MARKS;
  try {
    const value = JSON.parse(raw) as Partial<Marks>;
    const favorites = Array.isArray(value.favorites)
      ? value.favorites.filter(isRef)
      : [];
    const recents = Array.isArray(value.recents)
      ? value.recents.filter(isRef)
      : [];
    return { favorites, recents };
  } catch {
    return EMPTY_MARKS;
  }
};

/** Stand eines Benutzers; die Referenz bleibt stabil, solange nichts aendert. */
export const marksOf = (scope: string): Marks => {
  if (!scope || typeof window === "undefined") return EMPTY_MARKS;
  const known = cache.get(scope);
  if (known) return known;
  const loaded = parse(window.localStorage.getItem(storageKey(scope)));
  cache.set(scope, loaded);
  return loaded;
};

export const subscribeMarks = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const write = (scope: string, next: Marks): void => {
  cache.set(scope, next);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(scope), JSON.stringify(next));
    } catch {
      /** Ist der Speicher voll, bleibt die Merkliste nur fuer diese Sitzung bestehen. */
    }
  }
  listeners.forEach((listener) => listener());
};

const same = (
  entry: EntityRef,
  collection: CollectionKey,
  id: string,
): boolean => entry.collection === collection && entry.id === id;

export const isFavorite = (
  scope: string,
  collection: CollectionKey,
  id: string,
): boolean =>
  marksOf(scope).favorites.some((entry) => same(entry, collection, id));

/** Stern setzen oder entfernen; der Datensatz selbst bleibt unberuehrt. */
export const toggleFavorite = (
  scope: string,
  collection: CollectionKey,
  id: string,
): boolean => {
  if (!scope) return false;
  const current = marksOf(scope);
  const exists = current.favorites.some((entry) => same(entry, collection, id));
  const favorites = exists
    ? current.favorites.filter((entry) => !same(entry, collection, id))
    : [{ collection, id, at: new Date().toISOString() }, ...current.favorites];
  write(scope, { ...current, favorites });
  return !exists;
};

/** Aufruf eines Datensatzes vermerken; der neueste steht zuoberst. */
export const markVisited = (
  scope: string,
  collection: CollectionKey,
  id: string,
): void => {
  if (!scope) return;
  const current = marksOf(scope);
  const [first] = current.recents;
  if (first && same(first, collection, id)) return;
  const recents = [
    { collection, id, at: new Date().toISOString() },
    ...current.recents.filter((entry) => !same(entry, collection, id)),
  ].slice(0, RECENT_LIMIT);
  write(scope, { ...current, recents });
};
