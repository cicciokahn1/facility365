'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { MapCard, NavigateButton } from '@/components/module/map-card';

export function SupplierDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="suppliers"
      id={id}
      headerExtra={(supplier) => <NavigateButton address={supplier.address} />}
      extraTabs={(supplier) => [
        {
          value: 'map',
          labelKey: 'tab.map',
          content: <MapCard address={supplier.address} />,
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="supplierId" value={id} />,
        },
        {
          value: 'maintenances',
          labelKey: 'module.maintenances',
          content: <RelatedList collection="maintenances" field="supplierId" value={id} />,
        },
        {
          value: 'sources',
          labelKey: 'module.sources',
          content: <RelatedList collection="sources" field="supplierId" value={id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="supplierId" value={id} />,
        },
      ]}
    />
  );
}
