import { ModuleList } from '@/components/module/module-list';
import { SolarOverview } from '@/components/modules/solar-overview';

export default function SolarPage() {
  return (
    <div className="flex flex-col gap-4">
      <SolarOverview />
      <ModuleList collection="solarplants" />
    </div>
  );
}
