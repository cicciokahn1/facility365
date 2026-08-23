import { EntityDetail } from '@/components/module/entity-detail';

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EntityDetail collection="inspections" id={id} />;
}
