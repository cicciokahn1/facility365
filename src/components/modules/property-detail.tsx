'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { AreaOverview } from '@/components/modules/area-overview';
import { PlanManager } from '@/components/modules/plan-manager';

export function PropertyDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="properties"
      id={id}
      defaultTab="dossier"
      extraTabs={(property, update) => [
        {
          value: 'buildings',
          labelKey: 'module.buildings',
          content: <RelatedList collection="buildings" field="propertyId" value={property.id} />,
        },
        {
          value: 'areas',
          labelKey: 'tab.areas',
          content: <AreaOverview level="properties" id={property.id} />,
        },
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: <PlanManager plans={property.plans} onChange={(plans) => update({ plans })} />,
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="propertyId" value={property.id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="propertyId" value={property.id} />,
        },
        {
          value: 'damages',
          labelKey: 'module.damages',
          content: <RelatedList collection="damages" field="propertyId" value={property.id} />,
        },
      ]}
    />
  );
}
