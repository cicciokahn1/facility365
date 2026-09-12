/**
 * Datenzugriff gegen Supabase.
 *
 * Jede Zeile gehoert einem Mandanten (Organisation), nicht nur einem Konto.
 * Gelesen und geschrieben wird ausschliesslich mit dem Sitzungsschluessel,
 * sodass die Regeln der Datenbank (Row Level Security) greifen: fremde
 * Mandanten sind unsichtbar, und eine Zeile laesst sich keinem fremden
 * Mandanten zuschreiben.
 *
 * Geloescht wird nie hart: Datensaetze wandern in den Papierkorb
 * (`deleted_at`) und bleiben wiederherstellbar.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { Repository } from '@/lib/data/repository';
import { supabase } from '@/lib/supabase/client';
import {
  AppSettings,
  BaseEntity,
  CollectionKey,
  EntityOf,
  ModuleConfig,
} from '@/lib/types';

interface Row {
  id: string;
  number: string;
  deleted_at: string | null;
  data: Record<string, unknown>;
}

const client = async (): Promise<SupabaseClient> => {
  const value = await supabase();
  if (!value) throw new Error('Supabase ist nicht konfiguriert');
  return value;
};

const currentUserId = async (): Promise<string> => {
  const { data, error } = await (await client()).auth.getUser();
  if (error || !data.user) throw new Error('Keine Anmeldung');
  return data.user.id;
};

/** Mandant der Anmeldung; die Datenbank entscheidet, nicht die Oberflaeche. */
export const currentTenantId = async (): Promise<string> => {
  const { data, error } = await (await client()).rpc('current_tenant');
  if (error) throw new Error(error.message);
  const tenant = typeof data === 'string' ? data : '';
  if (!tenant) throw new Error('Keine Organisation zugeordnet');
  return tenant;
};

const tenantSettingsMissing = (error: { code?: string; message?: string }): boolean =>
  error.code === '42P01' || error.message?.includes('tenant_settings') === true;

const rowOf = <K extends CollectionKey>(item: EntityOf<K>, userId: string, tenantId: string) => ({
  id: item.id,
  user_id: userId,
  tenant_id: tenantId,
  number: item.number,
  deleted_at: (item as BaseEntity).deletedAt ?? null,
  data: item as unknown as Record<string, unknown>,
});

export const supabaseRepository: Repository = {
  async read<K extends CollectionKey>(collection: K): Promise<EntityOf<K>[]> {
    const query = (await client())
      .from(collection)
      .select('id, number, data, deleted_at');
    const { data, error } =
      collection === 'activities'
        ? await query.order('created_at', { ascending: false }).limit(1500)
        : await query.order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    /** Der Papierkorb steht in der Spalte; die Oberflaeche liest ihn am Datensatz. */
    const rows = data as Row[];
    if (collection === 'activities') rows.reverse();
    return rows.map(
      (row) =>
        ({
          ...row.data,
          deletedAt: row.deleted_at ?? undefined,
        }) as unknown as EntityOf<K>,
    );
  },

  async save<K extends CollectionKey>(collection: K, item: EntityOf<K>): Promise<void> {
    const [userId, tenantId] = await Promise.all([currentUserId(), currentTenantId()]);
    const { error } = await (await client())
      .from(collection)
      .upsert(rowOf(item, userId, tenantId), { onConflict: 'tenant_id,id' });
    if (error) throw new Error(error.message);
  },

  async removeOne(collection: CollectionKey, id: string): Promise<void> {
    const tenantId = await currentTenantId();
    const { error } = await (await client())
      .from(collection)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async write<K extends CollectionKey>(collection: K, items: EntityOf<K>[]): Promise<void> {
    const [userId, tenantId] = await Promise.all([currentUserId(), currentTenantId()]);
    if (items.length > 0) {
      const { error } = await (await client())
        .from(collection)
        .upsert(
          items.map((item) => rowOf(item, userId, tenantId)),
          { onConflict: 'tenant_id,id' },
        );
      if (error) throw new Error(error.message);
    }
    /**
     * Fehlende Datensaetze wandern in den Papierkorb statt verloren zu gehen;
     * endgueltig entfernt werden sie nur ueber den Papierkorb selbst.
     */
    const keep = items.map((item) => item.id);
    const query = (await client())
      .from(collection)
      .update({ deleted_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    const { error: trashError } = keep.length
      ? await query.not('id', 'in', `(${keep.map((id) => `"${id}"`).join(',')})`)
      : await query.neq('id', '');
    if (trashError) throw new Error(trashError.message);
  },

  async readSettings(): Promise<Partial<AppSettings> | null> {
    const { data, error } = await (await client()).from('settings').select('data').maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.data as Partial<AppSettings> | undefined) ?? null;
  },

  async writeSettings(settings: AppSettings): Promise<void> {
    const userId = await currentUserId();
    const { error } = await (await client())
      .from('settings')
      .upsert({ user_id: userId, data: settings }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);
  },

  async readModuleConfig(): Promise<Partial<ModuleConfig> | null> {
    const tenantId = await currentTenantId();
    const { data, error } = await (await client())
      .from('tenant_settings')
      .select('data')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) {
      if (tenantSettingsMissing(error)) return null;
      throw new Error(error.message);
    }
    return (data?.data as Partial<ModuleConfig> | undefined) ?? null;
  },

  async writeModuleConfig(config: ModuleConfig): Promise<void> {
    const tenantId = await currentTenantId();
    const { error } = await (await client())
      .from('tenant_settings')
      .upsert(
        {
          tenant_id: tenantId,
          data: config,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id' },
      );
    if (error && !tenantSettingsMissing(error)) throw new Error(error.message);
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
    const tenantId = await currentTenantId();
    for (const collection of collections) {
      const { error } = await (await client())
        .from(collection)
        .update({ deleted_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .is('deleted_at', null);
      if (error) throw new Error(error.message);
    }
  },
};
