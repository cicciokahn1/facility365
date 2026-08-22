import { CleaningAreaDetail } from '@/components/modules/cleaning-area-detail';

export default async function CleaningAreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CleaningAreaDetail id={id} />;
}
