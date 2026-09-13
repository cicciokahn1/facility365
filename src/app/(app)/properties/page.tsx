import { ModuleList } from '@/components/module/module-list';
import { PropertyTemplateDialog } from '@/components/modules/property-template-dialog';

export default function PropertyPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PropertyTemplateDialog />
      </div>
      <ModuleList collection="properties" />
    </div>
  );
}
