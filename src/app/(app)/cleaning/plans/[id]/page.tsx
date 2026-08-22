import { CleaningPlanDetail } from '@/components/modules/cleaning-plan-detail';

export default async function CleaningPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CleaningPlanDetail id={id} />;
}
