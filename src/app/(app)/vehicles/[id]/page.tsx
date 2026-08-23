import { EntityDetail } from '@/components/module/entity-detail';

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="vehicles" id={id} />;
}
