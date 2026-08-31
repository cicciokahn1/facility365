import { PlaygroundCheckDetail } from '@/components/modules/playground-check-detail';

export default async function PlaygroundCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlaygroundCheckDetail id={id} />;
}
