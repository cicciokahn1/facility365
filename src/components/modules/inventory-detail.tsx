'use client';

/**
 * Detailansicht eines Inventargegenstands mit eigenem QR-Etikett.
 */
import { EntityDetail } from '@/components/module/entity-detail';
import { RecordQr } from '@/components/modules/record-qr';

export function InventoryDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="inventory"
      id={id}
      extraTabs={(item) => [
        {
          value: 'qr',
          labelKey: 'tab.qr',
          content: (
            <RecordQr
              path={`/inventory/${item.id}`}
              number={item.inventoryNumber || item.number}
              title={item.title}
            />
          ),
        },
      ]}
    />
  );
}
