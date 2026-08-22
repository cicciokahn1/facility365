import { CleaningTaskDetail } from '@/components/modules/cleaning-task-detail';

export default async function CleaningTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CleaningTaskDetail id={id} />;
}
