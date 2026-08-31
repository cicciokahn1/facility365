'use client';

/**
 * Angemeldete Person und ihr Sichtbereich.
 *
 * Die Rolle bestimmt die Module, der Benutzerdatensatz den Umfang. Damit jede
 * Ansicht dieselbe Antwort bekommt, wird hier einmal berechnet, welche
 * Standorte erlaubt sind und ob ein Datensatz dazugehoert.
 *
 * Ist kein Benutzer gepflegt oder passt keiner zur Anmeldung, gilt der volle
 * Zugriff - bestehende Installationen bleiben unveraendert nutzbar.
 */
import { useCallback, useMemo } from 'react';

import { useAuth } from '@/lib/auth/provider';
import {
  AccessScope,
  canDelete,
  canRead,
  canWrite,
  scopeOf,
} from '@/lib/auth/permissions';
import { useCollectionItems } from '@/lib/data/store';
import { stringField } from '@/lib/entity-values';
import { moduleEnabled } from '@/lib/packages/packages';
import { useSettings } from '@/lib/settings/provider';
import { AppUser, BaseEntity, CollectionKey, ModuleKey } from '@/lib/types';

/** Sammlungen ohne Ortsbezug: sie werden nicht nach Standort eingeschraenkt. */
const WITHOUT_LOCATION: CollectionKey[] = [
  'customers',
  'suppliers',
  'users',
  'activities',
  'cleaners',
  'stock',
  'sources',
];

/** Felder, ueber die ein Datensatz zu seinem Standort findet - in dieser Reihenfolge. */
const LOCATION_FIELDS = ['siteId', 'propertyId', 'buildingId', 'roomId', 'areaId'] as const;

/** Felder, die eine persoenliche Zustaendigkeit ausdruecken. */
const OWN_FIELDS = ['assigneeUserId', 'reportedById', 'responsibleId', 'cleanerId'] as const;

export interface Access {
  scope: AccessScope;
  /** Angemeldete Person; leer, solange keine Benutzerverwaltung gepflegt ist. */
  user: AppUser | null;
  ready: boolean;
  canRead: (module: ModuleKey) => boolean;
  canWrite: (module: ModuleKey) => boolean;
  canDelete: (module: ModuleKey) => boolean;
  /** Erlaubte Standorte; leer bedeutet «alle». */
  allowedSiteIds: string[];
  /** Gehoert der Datensatz zum Sichtbereich? */
  visible: (collection: CollectionKey, entity: BaseEntity) => boolean;
  /** Ist das Modul im gewaehlten Branchenpaket enthalten? */
  moduleActive: (module: ModuleKey) => boolean;
}

/** Angemeldete Person aus Einstellung, E-Mail-Konto oder Entra-Kennung. */
export function useActiveUser(): AppUser | null {
  const { settings } = useSettings();
  const auth = useAuth();
  const users = useCollectionItems('users');

  return useMemo(() => {
    if (users.length === 0) return null;
    const chosen = users.find((user) => user.id === settings.activeUserId);
    if (chosen) return chosen;
    /** Ohne bewusste Wahl entscheidet die Anmeldung - spaeter auch Entra. */
    const email = auth.user?.email?.toLowerCase() ?? '';
    const external = auth.user?.id ?? '';
    return (
      users.find((user) => user.externalId && user.externalId === external) ??
      users.find((user) => user.email.toLowerCase() === email && email !== '') ??
      null
    );
  }, [auth.user, settings.activeUserId, users]);
}

export function useAccess(): Access {
  const user = useActiveUser();
  const scope = useMemo(() => scopeOf(user), [user]);
  const { settings } = useSettings();

  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const areas = useCollectionItems('cleaningareas');

  /** Jede Ebene einmal auf ihren Standort zurueckfuehren. */
  const siteOf = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((site) => map.set(site.id, site.id));
    properties.forEach((property) => map.set(property.id, property.siteId ?? ''));
    buildings.forEach((building) => map.set(building.id, map.get(building.propertyId) ?? ''));
    rooms.forEach((room) => map.set(room.id, map.get(room.buildingId) ?? ''));
    areas.forEach((area) =>
      map.set(area.id, map.get(area.buildingId) || map.get(area.propertyId) || ''),
    );
    return map;
  }, [areas, buildings, properties, rooms, sites]);

  /** Standorte der eigenen Organisation, sofern die Rolle nicht alles sieht. */
  const allowedSiteIds = useMemo(() => {
    if (scope.allOrganizations && scope.allSites) return [];
    const ofOrganization = scope.allOrganizations
      ? sites
      : sites.filter((site) => (site.organizationId ?? '') === scope.organizationId);
    if (scope.allSites) return ofOrganization.map((site) => site.id);
    const assigned = scope.siteIds;
    if (assigned.length === 0) return ofOrganization.map((site) => site.id);
    return ofOrganization.filter((site) => assigned.includes(site.id)).map((site) => site.id);
  }, [scope, sites]);

  const visible = useCallback(
    (collection: CollectionKey, entity: BaseEntity) => {
      if (!scope.active) return false;
      if (scope.ownOnly) {
        const own = OWN_FIELDS.some(
          (field) => stringField(entity, field) === (scope.user?.id ?? ''),
        );
        /** Eigene Zuweisung genuegt; ohne Zuweisung bleibt der Datensatz verborgen. */
        if (!own) return false;
      }
      if (collection === 'organizations') {
        return scope.allOrganizations || entity.id === scope.organizationId;
      }
      if (allowedSiteIds.length === 0) return true;
      if (WITHOUT_LOCATION.includes(collection)) return true;
      if (collection === 'sites') return allowedSiteIds.includes(entity.id);
      for (const field of LOCATION_FIELDS) {
        const value = stringField(entity, field);
        if (!value) continue;
        const site = siteOf.get(value) ?? '';
        /** Noch nicht zugeordnete Daten bleiben sichtbar; sonst gingen sie verloren. */
        if (!site) return true;
        return allowedSiteIds.includes(site);
      }
      return true;
    },
    [allowedSiteIds, scope, siteOf],
  );

  return useMemo(
    () => ({
      scope,
      user,
      ready: true,
      canRead: (module: ModuleKey) => moduleEnabled(settings, module) && canRead(scope, module),
      canWrite: (module: ModuleKey) => moduleEnabled(settings, module) && canWrite(scope, module),
      canDelete: (module: ModuleKey) => moduleEnabled(settings, module) && canDelete(scope, module),
      allowedSiteIds,
      visible,
      moduleActive: (module: ModuleKey) => moduleEnabled(settings, module),
    }),
    [allowedSiteIds, scope, settings, user, visible],
  );
}
