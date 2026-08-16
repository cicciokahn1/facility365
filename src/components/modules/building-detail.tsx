'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { FloorEditor } from '@/components/modules/floor-editor';
import { PlanManager } from '@/components/modules/plan-manager';

export function BuildingDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="buildings"
      id={id}
      extraTabs={(building, update) => [
        {
          value: 'floors',
          labelKey: 'tab.floors',
          content: <FloorEditor floors={building.floors} onChange={(floors) => update({ floors })} />,
        },
        {
          value: 'rooms',
          labelKey: 'module.rooms',
          content: <RelatedList collection="rooms" field="buildingId" value={building.id} />,
        },
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: (
            <PlanManager
              plans={building.plans}
              floors={building.floors}
              onChange={(plans) => update({ plans })}
            />
          ),
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="buildingId" value={building.id} />,
        },
      ]}
    />
  );
}
