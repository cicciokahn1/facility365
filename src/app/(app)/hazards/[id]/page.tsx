import { HazardDetail } from '@/components/modules/hazard-detail';

export default async function HazardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HazardDetail id={id} />;
}
