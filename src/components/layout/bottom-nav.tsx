'use client';

/** Navigation am unteren Rand fuer Smartphones. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MOBILE_NAV_KEYS, MODULES, moduleByKey } from '@/lib/modules';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const primary = MOBILE_NAV_KEYS.map(moduleByKey);
  const rest = MODULES.filter((module) => !MOBILE_NAV_KEYS.includes(module.key));

  return (
    <nav
      data-testid="bottom-nav"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur lg:hidden"
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
                  active ? 'text-primary' : 'text-muted-foreground',
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
              className="flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground"
            >
              <MoreHorizontal className="size-5" aria-hidden />
              <span>{t('nav.more')}</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <ul className="grid grid-cols-3 gap-2 p-4 pt-0">
                {rest.map((module) => {
                  const Icon = module.icon;
                  return (
                    <li key={module.key}>
                      <Link
                        href={module.path}
                        onClick={() => setOpen(false)}
                        className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-2 text-center text-xs font-medium"
                      >
                        <Icon className="size-5 text-primary" aria-hidden />
                        <span className="line-clamp-2">{t(module.labelKey)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
