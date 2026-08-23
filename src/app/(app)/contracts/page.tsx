import { ModuleList } from '@/components/module/module-list';
import { ContractReminders } from '@/components/modules/contract-reminders';

export default function ContractsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ContractReminders />
      <ModuleList collection="contracts" />
    </div>
  );
}
