'use client';

/**
 * Zugriffsschutz der Seiten.
 *
 * Die Rolle entscheidet ueber jedes Modul - auch bei direkt eingegebener
 * Adresse. Zusaetzlich hinterlegt der Wachposten die angemeldete Person fuer
 * die Aktivitaetshistorie.
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

import { useAccess } from '@/lib/auth/scope';
import { setActor } from '@/lib/data/actor';
import { useT } from '@/lib/i18n/provider';
import { MODULES } from '@/lib/modules';

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const access = useAccess();
  const t = useT();
  const user = access.user;

  useEffect(() => {
    setActor({ id: user?.id ?? '', name: user?.name ?? '' });
  }, [user]);

  /** Laengster passender Pfad gewinnt, damit Unterseiten richtig zugeordnet werden. */
  const moduleDef = MODULES.filter(
    (module) => pathname === module.path || pathname.startsWith(`${module.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0];

  if (moduleDef && !access.canRead(moduleDef.key)) {
    return (
      <div
        data-testid="access-denied"
        className="mx-auto flex max-w-md flex-col items-center gap-2 py-16 text-center"
      >
        <ShieldAlert className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-lg font-semibold">{t('access.denied')}</p>
        <p className="text-sm text-muted-foreground">{t('access.deniedHint')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
