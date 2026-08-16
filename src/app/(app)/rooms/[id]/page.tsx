import { RoomDetail } from '@/components/modules/room-detail';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoomDetail id={id} />;
}
