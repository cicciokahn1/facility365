import { EntityDetail } from "@/components/module/entity-detail";

export default async function OncallIncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntityDetail collection="oncallincidents" id={id} />;
}
