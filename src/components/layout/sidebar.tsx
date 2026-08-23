'use client';

/** Seitenleiste fuer Tablet und Desktop. */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/provider';
import { useAccess } from '@/lib/auth/scope';
import { BRAND_MARK_SRC, isBrandLogo } from '@/lib/branding/logo';
import { MODULES, NAV_GROUPS } from '@/lib/modules';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const auth = useAuth();
  const { settings } = useSettings();
  const access = useAccess();

  return (
    <nav className="flex h-full w-full flex-col gap-1 overflow-y-auto bg-sidebar px-3 py-4">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-3 rounded-lg px-2 py-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Data-URL aus den Einstellungen */}
        <img
          src={isBrandLogo(settings.companyLogo) ? BRAND_MARK_SRC : settings.companyLogo}
          alt=""
          className="size-9 rounded-lg object-contain dark:bg-white/95 dark:p-0.5"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {settings.companyName || t('app.name')}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{t('app.tagline')}</span>
        </span>
      </Link>

      {NAV_GROUPS.map((group) => {
        const modules = MODULES.filter(
          (module) => module.group === group.key && access.canRead(module.key),
        );
        if (modules.length === 0) return null;
        return (
          <div key={group.key} className="mb-2">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t(group.labelKey)}
            </p>
            <ul className="space-y-0.5">
              {modules.map((module) => {
                const active = pathname === module.path || pathname.startsWith(`${module.path}/`);
                const Icon = module.icon;
                return (
                  <li key={module.key}>
                    <Link
                      href={module.path}
                      onClick={onNavigate}
                      data-active={active}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/60',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{t(module.labelKey)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="mt-auto flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initials(settings.profileName || settings.companyName || 'Facility365')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" data-testid="account-name">
            {auth.user?.email || settings.profileName || settings.companyName || 'Facility365'}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {settings.profileRole || t('common.notSet')}
          </span>
        </span>
        {auth.enabled && auth.user ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('auth.signOut')}
            data-testid="sign-out"
            onClick={() => {
              void auth.signOut().then(() => router.replace('/login'));
            }}
          >
            <LogOut className="size-4" />
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
