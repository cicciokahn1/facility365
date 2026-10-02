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

const TEST_SEED_KEY = 'facility365.testdata.seeded';

/**
 * Mitgelieferte TEST-Liegenschaften einmalig ergaenzen.
 *
 * Die Datensaetze tragen feste TEST-Kennungen; bereits vorhandene werden
 * uebersprungen, nichts wird ueberschrieben. Je Datenraum laeuft der Abgleich
 * nur einmal, damit bewusst geloeschte Testdaten nicht wiederkehren.
 */
export const ensureTestData = async (
  scope: string,
  repository: Repository,
): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const seeded = window.localStorage.getItem(TEST_SEED_KEY)?.split(',') ?? [];
  if (seeded.includes(scope)) return 0;
  const { default: snapshot } = await import(
    '../../../testdata/Facility365-realistische-testdaten.json'
  );
  const added = await mergeSnapshot(snapshot as unknown as Snapshot, repository);
  window.localStorage.setItem(TEST_SEED_KEY, [...seeded, scope].join(','));
  return added;
};

export const ensureModuleExamples = async (
  scope: string,
  repository: Repository,
): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const seededKey = `facility365.module-examples.${scope}`;
  if (window.localStorage.getItem(seededKey) === '1') return 0;
  const { default: snapshot } = await import(
    '../../../testdata/Facility365-module-beispiele.json'
  );
  const added = await mergeSnapshot(snapshot as unknown as Snapshot, repository);
  window.localStorage.setItem(seededKey, '1');
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

/** Historischer Schluessel fuer die Migration alter Browser-Sicherungen. */
const LOCAL_KEY = 'facility365.v2.backup';
const BACKUP_DB = 'facility365.backup';
const BACKUP_STORE = 'snapshots';
const BACKUP_ID = 'latest';
const REMOTE_BACKUP_DISABLED_KEY = 'facility365.remote-backup-disabled';

const remoteBackupDisabled = (): boolean =>
  typeof window !== 'undefined' &&
  window.sessionStorage.getItem(REMOTE_BACKUP_DISABLED_KEY) === '1';

const disableRemoteBackup = (): void => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(REMOTE_BACKUP_DISABLED_KEY, '1');
  }
};

const storeDeviceSnapshot = async (snapshot: Snapshot): Promise<boolean> => {
  try {
    await writeIndexedSnapshot(snapshot);
    window.localStorage.removeItem(LOCAL_KEY);
    return true;
  } catch {
    return false;
  }
};

const openBackupDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(BACKUP_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('backup-open-failed'));
  });

const readIndexedSnapshot = async (): Promise<Snapshot | null> => {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openBackupDb();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(BACKUP_STORE, 'readonly')
      .objectStore(BACKUP_STORE)
      .get(BACKUP_ID);
    request.onsuccess = () => resolve((request.result as Snapshot | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('backup-read-failed'));
  });
};

const writeIndexedSnapshot = async (snapshot: Snapshot): Promise<void> => {
  if (typeof indexedDB === 'undefined') throw new Error('indexeddb-unavailable');
  const db = await openBackupDb();
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(BACKUP_STORE, 'readwrite')
      .objectStore(BACKUP_STORE)
      .put(snapshot, BACKUP_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('backup-write-failed'));
  });
};

const migrateLegacySnapshot = async (): Promise<Snapshot | null> => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const snapshot = value as Snapshot;
    if (typeof snapshot.collections !== 'object') return null;
    await writeIndexedSnapshot(snapshot);
    window.localStorage.removeItem(LOCAL_KEY);
    return snapshot;
  } catch {
    return null;
  }
};

/**
 * Sicherung ablegen.
 *
 * Mit Datenbank liegt die Sicherung in der Organisation, sonst auf dem Geraet.
 * Reicht der Platz auf dem Geraet nicht, bleibt es bei der Sicherungsdatei.
 */
export const storeSnapshot = async (snapshot: Snapshot): Promise<boolean> => {
  const client = await supabase();
  if (!client || remoteBackupDisabled()) return storeDeviceSnapshot(snapshot);
  const { error } = await client.from('backups').insert({ data: snapshot });
  if (!error) return true;
  disableRemoteBackup();
  return storeDeviceSnapshot(snapshot);
};

/** Jüngste Sicherung der Organisation beziehungsweise des Geraets. */
export const latestSnapshot = async (): Promise<{ at: string; snapshot: Snapshot } | null> => {
  const client = await supabase();
  if (!client || remoteBackupDisabled()) {
    try {
      const snapshot = (await readIndexedSnapshot()) ?? (await migrateLegacySnapshot());
      if (!snapshot) return null;
      return { at: snapshot.createdAt, snapshot };
    } catch {
      return null;
    }
  }
  const { data, error } = await client
    .from('backups')
    .select('id, created_at, data')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    disableRemoteBackup();
    const snapshot = (await readIndexedSnapshot()) ?? (await migrateLegacySnapshot());
    return snapshot ? { at: snapshot.createdAt, snapshot } : null;
  }
  if (!data || data.length === 0) return null;
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
  const last = await latestSnapshot();
  const day = 24 * 60 * 60 * 1000;
  if (last && Date.now() - new Date(last.at).getTime() < day) return false;
  const snapshot = snapshotOf(store);
  if (snapshotSize(snapshot) === 0) return false;
  return storeSnapshot(snapshot);
};
