import { LegionellaDetail } from '@/components/modules/legionella-detail';

export default async function LegionellaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LegionellaDetail id={id} />;
}
