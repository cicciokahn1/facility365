'use client';

/** Navigation am unteren Rand fuer Smartphones. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronRight, Clock3, MoreHorizontal } from 'lucide-react';

import { useAccess } from '@/lib/auth/scope';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  MOBILE_NAV_KEYS,
  MODULES,
  NAV_GROUPS,
  NavGroup,
  SIMPLE_HIDDEN_KEYS,
  groupOfPath,
  moduleByKey,
  sortNavigationModules,
} from '@/lib/modules';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const access = useAccess();
  const { settings } = useSettings();
  const simple = settings.simpleMode !== false;
  const primary = MOBILE_NAV_KEYS.map(moduleByKey).filter((module) => access.canRead(module.key));
  /** Im Menue steht jede Funktion in ihrem Ordner - auch die vier unten. */
  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        modules: sortNavigationModules(
          MODULES.filter(
            (module) =>
              module.group === group.key &&
              !module.hideFromNav &&
              (simple || !SIMPLE_HIDDEN_KEYS.has(module.key)) &&
              access.canRead(module.key),
          ),
        ),
      })).filter((group) => group.modules.length > 0),
    [access, simple],
  );
  /** Ordner bleiben zu, bis sie gebraucht werden; nur der aktuelle ist offen. */
  const current = groupOfPath(pathname);
  const [folders, setFolders] = useState<Partial<Record<NavGroup, boolean>>>({});
  const isOpen = (key: NavGroup) => folders[key] ?? key === current;
  const toggle = (key: NavGroup) =>
    setFolders((state) => ({
      ...state,
      [key]: !(state[key] ?? key === current),
    }));

  return (
    <nav
      data-testid="bottom-nav"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/95 backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {primary.map((module) => {
          const active = pathname === module.path || pathname.startsWith(`${module.path}/`);
          const Icon = module.icon;
          return (
            <li key={module.key}>
              <Link
                href={module.path}
                data-active={active}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium',
                  active ? 'text-sidebar-primary' : 'text-sidebar-foreground/75',
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="w-full truncate text-center">{t(module.labelKey)}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              data-testid="bottom-nav-more"
              className="flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-sidebar-foreground/75"
            >
              <MoreHorizontal className="size-5" aria-hidden />
              <span>{t('nav.more')}</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 p-4 pt-0">
                {groups.map((group) => {
                  const expanded = group.flat || isOpen(group.key);
                  const GroupIcon = group.icon;
                  return (
                    <section key={group.key} data-testid={`nav-group-${group.key}`}>
                      {group.flat ? null : (
                        <button
                          type="button"
                          onClick={() => toggle(group.key)}
                          aria-expanded={expanded}
                          data-testid={`nav-folder-${group.key}`}
                          className="mb-2 flex w-full items-center gap-2 rounded-lg border bg-card px-3 py-2 text-left text-sm font-semibold"
                        >
                          <GroupIcon className="size-4 shrink-0 text-primary" aria-hidden />
                          <span className="flex-1 truncate">{t(group.labelKey)}</span>
                          <ChevronRight
                            className={cn(
                              'size-4 shrink-0 transition-transform',
                              expanded && 'rotate-90',
                            )}
                            aria-hidden
                          />
                        </button>
                      )}
                      {/* Kacheln entstehen erst beim Oeffnen des Ordners. */}
                      {!expanded ? null : (
                        <ul className="grid grid-cols-2 gap-3">
                          {group.key === 'work' && access.canRead('reports') ? (
                            <li>
                              <Link
                                href="/work-time"
                                onClick={() => setOpen(false)}
                                data-active={pathname === '/work-time'}
                                className={cn(
                                  'flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border bg-card px-2 py-2 text-center text-xs font-medium',
                                  pathname === '/work-time'
                                    ? 'border-primary text-primary'
                                    : 'text-foreground/80',
                                )}
                              >
                                <Clock3 className="size-5" aria-hidden />
                                <span className="line-clamp-2">{t('quickWorkTime.title')}</span>
                              </Link>
                            </li>
                          ) : null}
                          {group.modules.map((module) => {
                            const Icon = module.icon;
                            const active =
                              pathname === module.path || pathname.startsWith(`${module.path}/`);
                            return (
                              <li key={module.key}>
                                <Link
                                  href={module.path}
                                  onClick={() => setOpen(false)}
                                  data-active={active}
                                  className={cn(
                                    'flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border bg-card px-2 py-3 text-center text-sm font-medium leading-tight',
                                    active && 'border-primary/40 bg-brand-soft',
                                  )}
                                >
                                  <Icon className="size-5 text-primary" aria-hidden />
                                  <span className="line-clamp-2 w-full break-words hyphens-auto">
                                    {t(module.labelKey)}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
