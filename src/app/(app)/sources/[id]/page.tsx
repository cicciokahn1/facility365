import { SourceDetail } from '@/components/modules/source-detail';

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SourceDetail id={id} />;
}
