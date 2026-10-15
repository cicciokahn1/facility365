import { ModuleList } from '@/components/module/module-list';
import { WarrantyExpiry } from '@/components/modules/warranty-expiry';

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <WarrantyExpiry />
      <ModuleList collection="inventory" />
    </div>
  );
}
