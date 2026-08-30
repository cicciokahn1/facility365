/**
 * Sicherung, Wiederherstellung und Datenuebernahme.
 *
 * Eine Sicherung ist ein vollstaendiger Abzug aller Sammlungen. Beim
 * Wiederherstellen wird nur ergaenzt, was fehlt - vorhandene Datensaetze
 * bleiben unveraendert und nichts wird geloescht. Damit ist auch ein
 * versehentlich eingespielter Stand ungefaehrlich.
 */
import { localRepository, Repository } from '@/lib/data/repository';
import { supabase } from '@/lib/supabase/client';
import { COLLECTIONS } from '@/lib/data/collections';
import { BaseEntity, CollectionKey, EntityOf } from '@/lib/types';

export interface Snapshot {
  createdAt: string;
  collections: Partial<Record<CollectionKey, BaseEntity[]>>;
}

export const snapshotOf = (store: Record<CollectionKey, BaseEntity[]>): Snapshot => ({
  createdAt: new Date().toISOString(),
  collections: COLLECTIONS.reduce<Partial<Record<CollectionKey, BaseEntity[]>>>((acc, key) => {
    if (store[key].length > 0) acc[key] = store[key];
    return acc;
  }, {}),
});

/** Zaehlt die Datensaetze einer Sicherung. */
export const snapshotSize = (snapshot: Snapshot): number =>
  Object.values(snapshot.collections).reduce((sum, items) => sum + (items?.length ?? 0), 0);

/** Vollstaendiger Abzug der Daten dieses Geraets, unabhaengig von der Anmeldung. */
export const deviceSnapshot = async (): Promise<Snapshot> => {
  const collections: Partial<Record<CollectionKey, BaseEntity[]>> = {};
  await Promise.all(
    COLLECTIONS.map(async (key) => {
      const items = (await localRepository.read(key)) as BaseEntity[];
      if (items.length > 0) collections[key] = items;
    }),
  );
  return { createdAt: new Date().toISOString(), collections };
};

/**
 * Fehlende Datensaetze ergaenzen.
 *
 * Zurueckgegeben wird, wie viele Datensaetze neu dazugekommen sind; die
 * Oberflaeche meldet das und laedt den Stand neu.
 */
export const mergeSnapshot = async (
  snapshot: Snapshot,
  repository: Repository,
): Promise<number> => {
  let added = 0;
  for (const key of COLLECTIONS) {
    const incoming = snapshot.collections[key];
    if (!incoming || incoming.length === 0) continue;
    const existing = (await repository.read(key)) as BaseEntity[];
    const known = new Set(existing.map((item) => item.id));
    const numbers = new Set(existing.map((item) => item.number));
    for (const item of incoming) {
      if (known.has(item.id)) continue;
      /** Gleiche Nummer aus einem anderen Bestand: die Nummer wird freigelassen. */
      const entity = numbers.has(item.number) ? { ...item, number: '' } : item;
      await repository.save(key, entity as EntityOf<typeof key>);
      known.add(item.id);
      if (entity.number) numbers.add(entity.number);
      added += 1;
    }
  }
  return added;
};

/** Sicherung als Datei anbieten. */
export const downloadSnapshot = (snapshot: Snapshot): void => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facility365-sicherung-${snapshot.createdAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/** Sicherung aus einer Datei lesen; ungueltige Dateien werden abgewiesen. */
export const readSnapshotFile = async (file: File): Promise<Snapshot> => {
  const parsed: unknown = JSON.parse(await file.text());
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Snapshot).collections !== 'object'
  ) {
    throw new Error('Ungueltige Sicherungsdatei');
  }
  const value = parsed as Snapshot;
  return {
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    collections: value.collections ?? {},
  };
};

interface BackupRow {
  id: string;
  created_at: string;
  data: Snapshot;
}

/** Sicherung in der Datenbank ablegen; ohne Anmeldung passiert nichts. */
export const storeSnapshot = async (snapshot: Snapshot): Promise<boolean> => {
  const client = supabase();
  if (!client) return false;
  const { error } = await client.from('backups').insert({ data: snapshot });
  return !error;
};

/** Jüngste Sicherung der Organisation. */
export const latestSnapshot = async (): Promise<{ at: string; snapshot: Snapshot } | null> => {
  const client = supabase();
  if (!client) return null;
  const { data, error } = await client
    .from('backups')
    .select('id, created_at, data')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const row = data[0] as BackupRow;
  return { at: row.created_at, snapshot: row.data };
};

/**
 * Taegliche Sicherung.
 *
 * Liegt die letzte Sicherung laenger als einen Tag zurueck, wird eine neue
 * abgelegt. Aufgerufen wird das beim Start der Anwendung.
 */
export const ensureDailySnapshot = async (
  store: Record<CollectionKey, BaseEntity[]>,
): Promise<boolean> => {
  const client = supabase();
  if (!client) return false;
  const last = await latestSnapshot();
  const day = 24 * 60 * 60 * 1000;
  if (last && Date.now() - new Date(last.at).getTime() < day) return false;
  const snapshot = snapshotOf(store);
  if (snapshotSize(snapshot) === 0) return false;
  return storeSnapshot(snapshot);
};
