import { ModuleList } from '@/components/module/module-list';
import { EnergyOverview } from '@/components/modules/energy-overview';

export default function EnergyPage() {
  return (
    <div className="flex flex-col gap-4">
      <EnergyOverview />
      <ModuleList collection="energy" />
    </div>
  );
}
