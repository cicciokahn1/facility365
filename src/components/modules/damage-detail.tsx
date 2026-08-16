'use client';

import { DoneButton } from '@/components/module/done-button';
import { EntityDetail } from '@/components/module/entity-detail';

export function DamageDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="damages"
      id={id}
      headerExtra={(damage) => (
        <DoneButton collection="damages" id={damage.id} status={damage.status} />
      )}
    />
  );
}
