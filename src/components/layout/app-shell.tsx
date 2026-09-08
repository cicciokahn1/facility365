"use client";

/**
 * Rahmen der Anwendung.
 *
 * Desktop: feste Seitenleiste. Tablet und Telefon: Kopfzeile mit Menue und
 * Navigation am unteren Rand. Der Inhalt bleibt in allen Faellen gleich.
 */
import { Suspense, useState } from "react";
import { Menu } from "lucide-react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { GlobalSearch } from "@/components/layout/global-search";
import { Sidebar } from "@/components/layout/sidebar";
import { SyncBanner } from "@/components/layout/sync-banner";
import { TrialBadge, TrialNotice } from "@/components/layout/trial-banner";
import { TrialGuard } from "@/components/layout/trial-guard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BRAND_MARK_SRC, isBrandLogo } from "@/lib/branding/logo";
import { useStorageError } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { useSettings } from "@/lib/settings/provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const storageError = useStorageError();
  const { settings } = useSettings();

  return (
    <TrialGuard>
      <div className="flex min-h-dvh w-full bg-background">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <div className="sticky top-0 h-dvh">
            <Sidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="safe-top sticky top-0 z-30 flex h-11 items-center gap-1 border-b bg-card/95 px-2 backdrop-blur lg:h-14 lg:gap-2 lg:px-6">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 lg:hidden"
                  aria-label={t("nav.menu")}
                  data-testid="menu-button"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                <Sidebar onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>

            <span className="flex min-w-0 items-center gap-1.5 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- Data-URL aus den Einstellungen */}
              <img
                src={
                  isBrandLogo(settings.companyLogo)
                    ? BRAND_MARK_SRC
                    : settings.companyLogo
                }
                alt=""
                className="size-6 shrink-0 rounded object-contain dark:bg-white/95 dark:p-0.5"
              />
              <span className="truncate text-sm font-semibold">
                {settings.companyName || t("app.name")}
              </span>
            </span>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 lg:ml-0 lg:justify-start">
              <GlobalSearch />
              <TrialBadge />
            </div>
          </header>

          <TrialNotice />

          <SyncBanner />

          {storageError ? (
            <p
              data-testid="storage-banner"
              className="bg-destructive/10 px-4 py-2 text-sm text-destructive"
            >
              {t("toast.storageFull")}
            </p>
          ) : null}

          {/* Grenze fuer Seiten, die Adressparameter lesen (z. B. ?new=1). */}
          <main className="min-w-0 flex-1 px-3 pb-24 pt-3 sm:px-4 lg:px-6 lg:pb-8 lg:pt-4">
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              }
            >
              {children}
            </Suspense>
          </main>
        </div>

        <BottomNav />
      </div>
    </TrialGuard>
  );
}
