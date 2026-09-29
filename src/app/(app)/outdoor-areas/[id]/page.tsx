import { OutdoorAreaDetail } from '@/components/modules/outdoor-area-detail';

export default async function OutdoorAreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OutdoorAreaDetail id={id} />;
}
