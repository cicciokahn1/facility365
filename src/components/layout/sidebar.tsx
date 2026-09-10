'use client';

/** Seitenleiste fuer Tablet und Desktop. */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronRight, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/provider';
import { useAccess } from '@/lib/auth/scope';
import { BRAND_MARK_SRC, isBrandLogo } from '@/lib/branding/logo';
import {
  MODULES,
  NAV_GROUPS,
  NavGroup,
  groupOfPath,
  sortNavigationModules,
} from '@/lib/modules';
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
  /** Nur der Ordner der aktuellen Seite ist zu Beginn offen; weitere kommen dazu. */
  const current = groupOfPath(pathname);
  const [folders, setFolders] = useState<Partial<Record<NavGroup, boolean>>>({});
  const isOpen = (key: NavGroup) => folders[key] ?? key === current;
  const toggle = (key: NavGroup) =>
    setFolders((state) => ({
      ...state,
      [key]: !(state[key] ?? key === current),
    }));

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        modules: sortNavigationModules(
          MODULES.filter(
            (module) => module.group === group.key && access.canRead(module.key),
          ),
        ),
      })).filter((group) => group.modules.length > 0),
    [access],
  );

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
          className="size-9 rounded-lg bg-white/95 object-contain p-0.5"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {settings.companyName || t('app.name')}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/70">
            {t('app.tagline')}
          </span>
        </span>
      </Link>

      {groups.map((group) => {
        const modules = group.modules;
        const open = group.flat || isOpen(group.key);
        const GroupIcon = group.icon;
        return (
          <div key={group.key} className="mb-1">
            {group.flat ? null : (
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={open}
                data-testid={`nav-folder-${group.key}`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  group.key === current
                    ? 'text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                <GroupIcon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate text-left">{t(group.labelKey)}</span>
                <ChevronRight
                  className={cn('size-4 shrink-0 transition-transform', open && 'rotate-90')}
                  aria-hidden
                />
              </button>
            )}
            {/* Unterpunkte entstehen erst beim Oeffnen des Ordners. */}
            {!open ? null : (
              <ul
                className={cn('space-y-0.5', !group.flat && 'ml-4 border-l border-sidebar-border pl-2')}
              >
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
                            : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon
                          className={cn('size-4 shrink-0', active && 'text-sidebar-primary')}
                          aria-hidden
                        />
                        <span className="truncate">{t(module.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <div className="mt-auto flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-3 py-2 text-sidebar-foreground">
        <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {initials(settings.profileName || settings.companyName || 'Facility365')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" data-testid="account-name">
            {auth.user?.email || settings.profileName || settings.companyName || 'Facility365'}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/70">
            {settings.profileRole || t('common.notSet')}
          </span>
        </span>
        {auth.enabled && auth.user ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
