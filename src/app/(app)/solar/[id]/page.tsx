import { SolarPlantDetail } from '@/components/modules/solar-plant-detail';

export default async function SolarPlantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SolarPlantDetail id={id} />;
}
