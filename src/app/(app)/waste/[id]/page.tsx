import { EntityDetail } from '@/components/module/entity-detail';

export default async function WasteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="waste" id={id} />;
}
