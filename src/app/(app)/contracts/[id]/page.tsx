import { ContractDetail } from '@/components/modules/contract-detail';

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractDetail id={id} />;
}
