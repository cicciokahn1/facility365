'use client';

/**
 * Organisation mit eigener Verwaltung.
 *
 * Alles Untergeordnete haengt indirekt an der Organisation: Liegenschaften ueber
 * den Standort, Gebaeude ueber die Liegenschaft, Raeume ueber das Gebaeude. Die
 * Kennungen werden deshalb einmal gesammelt und weitergereicht.
 */
import { useMemo } from 'react';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { useCollectionItems } from '@/lib/data/store';

export function OrganizationDetail({ id }: { id: string }) {
  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  const siteIds = useMemo(
    () => sites.filter((site) => site.organizationId === id).map((site) => site.id),
    [id, sites],
  );

  const propertyIds = useMemo(
    () =>
      properties
        .filter((property) => siteIds.includes(property.siteId))
        .map((property) => property.id),
    [properties, siteIds],
  );

  const buildingIds = useMemo(
    () =>
      buildings
        .filter((building) => propertyIds.includes(building.propertyId))
        .map((building) => building.id),
    [buildings, propertyIds],
  );

  return (
    <EntityDetail
      collection="organizations"
      id={id}
      extraTabs={() => [
        {
          value: 'sites',
          labelKey: 'module.sites',
          content: <RelatedList collection="sites" field="organizationId" value={id} />,
        },
        {
          value: 'properties',
          labelKey: 'module.properties',
          content: <RelatedList collection="properties" field="siteId" values={siteIds} />,
        },
        {
          value: 'buildings',
          labelKey: 'module.buildings',
          content: <RelatedList collection="buildings" field="propertyId" values={propertyIds} />,
        },
        {
          value: 'rooms',
          labelKey: 'module.rooms',
          content: <RelatedList collection="rooms" field="buildingId" values={buildingIds} />,
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="propertyId" values={propertyIds} />,
        },
      ]}
    />
  );
}
