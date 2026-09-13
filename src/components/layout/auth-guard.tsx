'use client';

/**
 * Schutz der Modulseiten.
 *
 * Ohne angemeldetes Konto zeigt die Anwendung keine Daten, sondern leitet zur
 * Anmeldung. Ist kein Supabase-Projekt hinterlegt, laeuft alles wie bisher
 * lokal weiter.
 */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/provider';
import { useT } from '@/lib/i18n/provider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.enabled || !auth.ready || auth.user) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.enabled, auth.ready, auth.user, pathname, router]);

  if (auth.enabled && (!auth.ready || !auth.user || !auth.membershipReady)) {
    return <div className="min-h-dvh bg-background" data-testid="auth-pending" />;
  }

  /** Deaktivierte oder nicht lesbare Mitgliedschaft: kein Zugriff, Daten bleiben bestehen. */
  const deactivated = auth.membership !== null && auth.membership.status !== 'active';
  if (auth.enabled && auth.membershipReady && (deactivated || !auth.membership)) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center"
        data-testid="auth-blocked"
      >
        <p className="text-sm">{t(deactivated ? 'auth.blocked' : 'auth.membershipMissing')}</p>
        <Button variant="outline" onClick={() => void auth.signOut()}>
          {t('auth.signOut')}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
