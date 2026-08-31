'use client';

/** Detail einer Photovoltaikanlage mit den erfassten Monatswerten. */
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';

export function SolarPlantDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="solarplants"
      id={id}
      extraTabs={(plant) => [
        {
          value: 'solaryields',
          labelKey: 'module.solaryields',
          content: <RelatedList collection="solaryields" field="plantId" value={plant.id} />,
        },
      ]}
    />
  );
}
