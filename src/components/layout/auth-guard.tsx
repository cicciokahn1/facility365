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

import { useAuth } from '@/lib/auth/provider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.enabled || !auth.ready || auth.user) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [auth.enabled, auth.ready, auth.user, pathname, router]);

  if (auth.enabled && (!auth.ready || !auth.user)) {
    return <div className="min-h-dvh bg-background" data-testid="auth-pending" />;
  }

  return <>{children}</>;
}
