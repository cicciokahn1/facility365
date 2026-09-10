import { ModuleList } from '@/components/module/module-list';
import { UserRateSettings } from '@/components/modules/user-rate-settings';

export default function UsersPage() {
  return (
    <>
      <UserRateSettings />
      <ModuleList collection="users" />
    </>
  );
}
