import { CleanerDetail } from '@/components/modules/cleaner-detail';

export default async function CleanerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CleanerDetail id={id} />;
}
