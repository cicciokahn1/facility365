import { ModuleList } from '@/components/module/module-list';
import { PropertyTemplateDialog } from '@/components/modules/property-template-dialog';
import { PropertiesMapLink } from '@/components/modules/properties-map-link';

export default function PropertyPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <PropertiesMapLink />
        <PropertyTemplateDialog />
      </div>
      <ModuleList collection="properties" />
    </div>
  );
}
