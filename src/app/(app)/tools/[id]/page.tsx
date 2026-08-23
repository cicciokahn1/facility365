import { ToolDetail } from '@/components/modules/tool-detail';

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ToolDetail id={id} />;
}
