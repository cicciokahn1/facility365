'use client';

import { EntityDetail } from '@/components/module/entity-detail';

export function DamageDetail({ id }: { id: string }) {
  return <EntityDetail collection="damages" id={id} />;
}
