import { ModuleList } from '@/components/module/module-list';
import { SiteOverview } from '@/components/modules/site-overview';

export default function SitesPage() {
  return (
    <div className="flex flex-col gap-4">
      <SiteOverview />
      <ModuleList collection="sites" />
    </div>
  );
}
