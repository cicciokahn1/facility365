import { ModuleList } from '@/components/module/module-list';
import { StockWarnings } from '@/components/modules/stock-warnings';

export default function StockPage() {
  return (
    <div className="flex flex-col gap-4">
      <StockWarnings />
      <ModuleList collection="stock" />
    </div>
  );
}
