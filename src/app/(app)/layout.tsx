import { AccessGuard } from '@/components/layout/access-guard';
import { DemoAutoSeed } from '@/components/modules/demo-data';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/layout/auth-guard';
import { DeferredReminders } from '@/components/layout/reminders-deferred';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <AccessGuard>{children}</AccessGuard>
      </AppShell>
      <DemoAutoSeed />
      <DeferredReminders />
    </AuthGuard>
  );
}
