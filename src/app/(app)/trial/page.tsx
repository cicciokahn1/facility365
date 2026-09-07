"use client";

/**
 * Uebersicht der kostenlosen Testversion.
 *
 * Zeigt die verbleibende Zeit, den Kontaktweg zur Verlaengerung und - fuer die
 * Administration - die Verlaengerung um weitere 30 Tage.
 */
import Link from "next/link";
import { CalendarClock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveUser } from "@/lib/auth/scope";
import { SUPPORT_EMAIL } from "@/lib/branding/support";
import { useT } from "@/lib/i18n/provider";
import { useTrial } from "@/lib/trial/provider";
import { TRIAL_DAYS } from "@/lib/trial/trial";

export default function TrialPage() {
  const t = useT();
  const trial = useTrial();
  const user = useActiveUser();
  const isAdmin = user?.role === "superadmin" || user?.role === "orgadmin";
  const subject = encodeURIComponent(t("trial.contactMail"));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-primary">
        {t("trial.title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {trial.isTrial
              ? t("trial.badge", { days: trial.daysLeft })
              : t("trial.expiredTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trial.isTrial ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="trial-remaining"
            >
              {t("trial.remaining", {
                days: trial.daysLeft,
                date: new Date(trial.endsAt).toLocaleDateString("de-CH"),
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("trial.expiredText")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{t("trial.separate")}</p>
          <p className="text-sm text-muted-foreground">{t("trial.noCard")}</p>

          <div className="flex flex-wrap gap-2">
            <Button asChild data-testid="trial-contact">
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}>
                <Mail className="size-4" aria-hidden />
                {t("trial.extend")}
              </a>
            </Button>
            {isAdmin && trial.isTrial ? (
              <Button
                variant="outline"
                data-testid="trial-extend"
                onClick={() => {
                  void trial
                    .extend(TRIAL_DAYS)
                    .then(() => toast.success(t("trial.extended")));
                }}
              >
                <CalendarClock className="size-4" aria-hidden />
                {t("trial.extendAdmin")}
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link href="/dashboard">{t("module.dashboard")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
