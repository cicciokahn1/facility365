'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { PlanLocation } from '@/components/modules/plan-location';
import { RecordQr } from '@/components/modules/record-qr';

export function RoomDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="rooms"
      id={id}
      extraTabs={(room) => [
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="roomId" value={room.id} />,
        },
        {
          value: 'plan',
          labelKey: 'tab.plans',
          content: <PlanLocation roomId={room.id} />,
        },
        {
          value: 'qr',
          labelKey: 'tab.qr',
          content: (
            <RecordQr
              path={`/rooms/${room.id}`}
              number={room.number}
              title={[room.roomNumber, room.name].filter(Boolean).join(' · ')}
            />
          ),
        },
      ]}
    />
  );
}
