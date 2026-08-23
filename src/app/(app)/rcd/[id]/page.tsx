import { EntityDetail } from '@/components/module/entity-detail';

export default async function RcdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EntityDetail collection="rcd" id={id} />;
}
