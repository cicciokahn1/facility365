'use client';

/** Detailansicht eines Kalendertermins. */
import { EntityDetail } from '@/components/module/entity-detail';

export function AppointmentDetail({ id }: { id: string }) {
  return <EntityDetail collection="appointments" id={id} />;
}
