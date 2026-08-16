import { BuildingDetail } from '@/components/modules/building-detail';

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BuildingDetail id={id} />;
}
