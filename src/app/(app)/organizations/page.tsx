import { ModuleList } from '@/components/module/module-list';
import { OrganizationOverview } from '@/components/modules/organization-overview';

export default function OrganizationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <OrganizationOverview />
      <ModuleList collection="organizations" />
    </div>
  );
}
