import { AppointmentDetail } from '@/components/modules/appointment-detail';

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppointmentDetail id={id} />;
}
