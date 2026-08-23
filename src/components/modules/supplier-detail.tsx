'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';

export function SupplierDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="suppliers"
      id={id}
      extraTabs={() => [
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
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="supplierId" value={id} />,
        },
      ]}
    />
  );
}
