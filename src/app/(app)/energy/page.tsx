import { ModuleList } from '@/components/module/module-list';
import { EnergyOverview } from '@/components/modules/energy-overview';
import { SolarOverview } from '@/components/modules/solar-overview';

export default function EnergyPage() {
  return (
    <div className="flex flex-col gap-4">
      <EnergyOverview />
      <SolarOverview />
      <ModuleList collection="energy" />
    </div>
  );
}
