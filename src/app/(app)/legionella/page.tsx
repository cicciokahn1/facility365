import { ModuleList } from '@/components/module/module-list';
import { LegionellaSettings } from '@/components/modules/legionella-settings';

export default function LegionellaPage() {
  return (
    <>
      <LegionellaSettings />
      <ModuleList collection="legionella" />
    </>
  );
}
