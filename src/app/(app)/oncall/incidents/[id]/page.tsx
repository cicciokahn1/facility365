import { OncallIncidentDetail } from "@/components/modules/oncall-incident-detail";

export default async function OncallIncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OncallIncidentDetail id={id} />;
}
