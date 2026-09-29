'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { PlanLocation } from '@/components/modules/plan-location';

export function OutdoorAreaDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="outdoorAreas"
      id={id}
      extraTabs={(area) => [
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: <PlanLocation outdoorAreaId={area.id} />,
        },
        {
          value: 'care',
          labelKey: 'outdoor.care',
          content: (
            <RelatedList
              collection="cleaningplans"
              field="areaId"
              value={area.cleaningAreaId}
            />
          ),
        },
        {
          value: 'tasks',
          labelKey: 'module.cleaningtasks',
          content: (
            <RelatedList
              collection="cleaningtasks"
              field="areaId"
              value={area.cleaningAreaId}
            />
          ),
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
