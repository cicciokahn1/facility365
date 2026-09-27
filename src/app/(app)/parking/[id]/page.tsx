import { EntityDetail } from '@/components/module/entity-detail';

export default async function ParkingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="parking" id={id} />;
}
