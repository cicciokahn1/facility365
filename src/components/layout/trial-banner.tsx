"use client";

/**
 * Anzeige der Testversion in der Kopfzeile.
 *
 * Sichtbar bleibt jederzeit die verbleibende Zeit; sieben und drei Tage vor
 * dem Ablauf kommt ein Hinweisband dazu. Ohne Testversion wird nichts
 * angezeigt.
 */
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

import { useT } from "@/lib/i18n/provider";
import { useTrial } from "@/lib/trial/provider";
import { TRIAL_WARN_DAYS } from "@/lib/trial/trial";
import { cn } from "@/lib/utils";

export function TrialBadge() {
  const t = useT();
  const trial = useTrial();
  if (!trial.isTrial || trial.expired) return null;

  const urgent = trial.daysLeft <= TRIAL_WARN_DAYS[1];
  return (
    <Link
      href="/trial"
      data-testid="trial-badge"
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        urgent
          ? "bg-warning/20 text-warning-foreground"
          : "bg-brand-soft text-primary",
      )}
    >
      <Clock className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">
        {t("trial.badge", { days: trial.daysLeft })}
      </span>
      <span className="sm:hidden">
        {t("trial.badgeShort", { days: trial.daysLeft })}
      </span>
    </Link>
  );
}

export function TrialNotice() {
  const t = useT();
  const trial = useTrial();
  if (!trial.isTrial || trial.expired) return null;
  if (!TRIAL_WARN_DAYS.includes(trial.daysLeft)) return null;

  return (
    <p
      data-testid="trial-notice"
      className="flex flex-wrap items-center gap-2 bg-warning/20 px-4 py-2 text-sm text-warning-foreground"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      {t("trial.notice", { days: trial.daysLeft })}
      <Link href="/trial" className="font-medium underline">
        {t("trial.extend")}
      </Link>
    </p>
  );
}
