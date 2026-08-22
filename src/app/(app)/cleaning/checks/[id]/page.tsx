import { EntityDetail } from '@/components/module/entity-detail';

export default async function CleaningCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="cleaningchecks" id={id} />;
}
