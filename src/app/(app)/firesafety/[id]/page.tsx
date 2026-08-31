import { FireCheckDetail } from '@/components/modules/fire-check-detail';

export default async function FireCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FireCheckDetail id={id} />;
}
