import { ModuleList } from '@/components/module/module-list';
import { CleanerRateSettings } from '@/components/modules/user-rate-settings';

export default function CleanersPage() {
  return (
    <>
      <CleanerRateSettings />
      <ModuleList collection="cleaners" />
    </>
  );
}
