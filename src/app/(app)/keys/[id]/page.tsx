import { KeyDetail } from '@/components/modules/key-detail';

export default async function KeyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KeyDetail id={id} />;
}
