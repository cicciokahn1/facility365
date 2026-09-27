import { EntityDetail } from '@/components/module/entity-detail';

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="visitors" id={id} />;
}
