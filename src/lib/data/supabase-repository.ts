/**
 * Datenzugriff gegen Supabase.
 *
 * Jede Zeile traegt die Kennung des angemeldeten Benutzers. Gelesen und
 * geschrieben wird ausschliesslich mit dem Sitzungsschluessel, sodass die
 * Regeln der Datenbank (Row Level Security) greifen: fremde Zeilen sind
 * unsichtbar, und eine Zeile laesst sich keinem fremden Konto zuschreiben.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { Repository } from '@/lib/data/repository';
import { supabase } from '@/lib/supabase/client';
import { AppSettings, CollectionKey, EntityOf } from '@/lib/types';

interface Row {
  id: string;
  number: string;
  data: Record<string, unknown>;
}

const client = (): SupabaseClient => {
  const value = supabase();
  if (!value) throw new Error('Supabase ist nicht konfiguriert');
  return value;
};

const currentUserId = async (): Promise<string> => {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw new Error('Keine Anmeldung');
  return data.user.id;
};

const rowOf = <K extends CollectionKey>(item: EntityOf<K>, userId: string) => ({
  id: item.id,
  user_id: userId,
  number: item.number,
  data: item as unknown as Record<string, unknown>,
});

export const supabaseRepository: Repository = {
  async read<K extends CollectionKey>(collection: K): Promise<EntityOf<K>[]> {
    const { data, error } = await client()
      .from(collection)
      .select('id, number, data')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Row[]).map((row) => row.data as unknown as EntityOf<K>);
  },

  async save<K extends CollectionKey>(collection: K, item: EntityOf<K>): Promise<void> {
    const userId = await currentUserId();
    const { error } = await client()
      .from(collection)
      .upsert(rowOf(item, userId), { onConflict: 'user_id,id' });
    if (error) throw new Error(error.message);
  },

  async removeOne(collection: CollectionKey, id: string): Promise<void> {
    const { error } = await client().from(collection).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async write<K extends CollectionKey>(collection: K, items: EntityOf<K>[]): Promise<void> {
    const userId = await currentUserId();
    const keep = items.map((item) => item.id);
    if (items.length > 0) {
      const { error } = await client()
        .from(collection)
        .upsert(
          items.map((item) => rowOf(item, userId)),
          { onConflict: 'user_id,id' },
        );
      if (error) throw new Error(error.message);
    }
    /** Entfernte Datensaetze loeschen; die Regeln beschraenken das auf eigene Zeilen. */
    const query = client().from(collection).delete();
    const { error: deleteError } = keep.length
      ? await query.not('id', 'in', `(${keep.map((id) => `"${id}"`).join(',')})`)
      : await query.neq('id', '');
    if (deleteError) throw new Error(deleteError.message);
  },

  async readSettings(): Promise<Partial<AppSettings> | null> {
    const { data, error } = await client().from('settings').select('data').maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.data as Partial<AppSettings> | undefined) ?? null;
  },

  async writeSettings(settings: AppSettings): Promise<void> {
    const userId = await currentUserId();
    const { error } = await client()
      .from('settings')
      .upsert({ user_id: userId, data: settings }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
  },

  async clear(): Promise<void> {
    const collections: CollectionKey[] = [
      'customers',
      'properties',
      'buildings',
      'rooms',
      'assets',
      'documents',
      'orders',
      'maintenances',
      'damages',
      'reports',
      'quotes',
      'invoices',
    ];
    for (const collection of collections) {
      const { error } = await client().from(collection).delete().neq('id', '');
      if (error) throw new Error(error.message);
    }
  },
};
