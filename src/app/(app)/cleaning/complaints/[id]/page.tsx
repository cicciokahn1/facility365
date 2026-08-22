import { EntityDetail } from '@/components/module/entity-detail';

export default async function CleaningComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="cleaningcomplaints" id={id} />;
}
