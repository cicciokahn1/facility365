'use client';

/**
 * Standort mit eigener Verwaltung.
 *
 * Die Ebenen darunter haengen indirekt am Standort: Gebaeude ueber die
 * Liegenschaft, Raeume ueber das Gebaeude. Die Kennungen werden deshalb einmal
 * gesammelt und an die verknuepften Listen weitergereicht.
 */
import { useMemo } from 'react';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { useCollectionItems } from '@/lib/data/store';

export function SiteDetail({ id }: { id: string }) {
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');

  const propertyIds = useMemo(
    () => properties.filter((property) => property.siteId === id).map((property) => property.id),
    [id, properties],
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
      collection="sites"
      id={id}
      extraTabs={() => [
        {
          value: 'properties',
          labelKey: 'module.properties',
          content: <RelatedList collection="properties" field="siteId" value={id} />,
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
