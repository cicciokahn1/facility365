'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { PlanLocation } from '@/components/modules/plan-location';
import { PlantIdentifier } from '@/components/modules/plant-id';

export function OutdoorAreaDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="outdoorAreas"
      id={id}
      beforeTabs={(area) => (
        <PlantIdentifier areaId={area.id} plantSpecies={area.plantSpecies} />
      )}
      extraTabs={(area) => [
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: <PlanLocation outdoorAreaId={area.id} />,
        },
        {
          value: 'calendar',
          labelKey: 'module.appointments',
          content: <RelatedList collection="appointments" field="outdoorAreaId" value={area.id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="outdoorAreaId" value={area.id} />,
        },
        {
          value: 'damages',
          labelKey: 'module.damages',
          content: <RelatedList collection="damages" field="outdoorAreaId" value={area.id} />,
        },
      ]}
    />
  );
}
