import { ModuleList } from '@/components/module/module-list';
import { UserInvite } from '@/components/modules/user-invite';
import { UserRateSettings } from '@/components/modules/user-rate-settings';

export default function UsersPage() {
  return (
    <>
      <UserInvite />
      <UserRateSettings />
      <ModuleList collection="users" />
    </>
  );
}
