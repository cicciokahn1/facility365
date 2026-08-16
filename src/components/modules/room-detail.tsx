'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';

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
      ]}
    />
  );
}
