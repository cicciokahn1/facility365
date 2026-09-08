"use client";

/**
 * Verbindungs- und Synchronisierungsstatus.
 *
 * Zeigt an, ob die App offline arbeitet und wie viele Aenderungen noch auf
 * die Uebertragung warten. Erfassen bleibt jederzeit moeglich - nichts geht
 * verloren.
 */
import { CloudOff, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { flushQueue, resetAttempts } from "@/lib/data/offline-repository";
import { supabaseRepository } from "@/lib/data/supabase-repository";
import { useReloadData, useSync } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";

export function SyncBanner() {
  const t = useT();
  const sync = useSync();
  const reload = useReloadData();

  if (sync.online && sync.pending === 0) return null;

  const label = !sync.online
    ? t("offline.text")
    : sync.failed
      ? t("sync.failed")
      : sync.syncing
        ? t("sync.running")
        : t("sync.pending");

  return (
    <p
      data-testid={sync.online ? "sync-banner" : "offline-banner"}
      className="flex flex-wrap items-center gap-2 bg-warning/20 px-4 py-2 text-sm text-warning-foreground"
    >
      {sync.online ? (
        <CloudOff className="size-4" aria-hidden />
      ) : (
        <WifiOff className="size-4" aria-hidden />
      )}
      <span>{label}</span>
      {sync.pending > 0 ? (
        <span data-testid="sync-pending" className="font-medium">
          {t("sync.count").replace("{n}", String(sync.pending))}
        </span>
      ) : null}
      {sync.online && sync.pending > 0 && !sync.syncing ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7"
          data-testid="sync-now"
          onClick={() => {
            resetAttempts();
            void flushQueue(supabaseRepository).then(() => reload());
          }}
        >
          <RefreshCw className="mr-1 size-3.5" aria-hidden />
          {t("sync.now")}
        </Button>
      ) : null}
    </p>
  );
}
