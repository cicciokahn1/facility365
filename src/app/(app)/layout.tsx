import { AccessGuard } from '@/components/layout/access-guard';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Reminders } from '@/components/layout/reminders';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <AccessGuard>{children}</AccessGuard>
      </AppShell>
      <Reminders />
    </AuthGuard>
  );
}
