import { StockDetail } from '@/components/modules/stock-detail';

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockDetail id={id} />;
}
