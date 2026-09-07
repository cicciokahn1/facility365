"use client";

/**
 * Sperre nach Ablauf der Testversion.
 *
 * Laeuft keine Testversion, bleibt die Anwendung unveraendert. Ist die Frist
 * abgelaufen, ersetzt die Seite «Testversion abgelaufen» den gesamten Inhalt;
 * die Daten bleiben erhalten und sind nach einer Verlaengerung sofort wieder
 * verfuegbar.
 */
import { CalendarClock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND_MARK_SRC } from "@/lib/branding/logo";
import { SUPPORT_EMAIL } from "@/lib/branding/support";
import { useAuth } from "@/lib/auth/provider";
import { useActiveUser } from "@/lib/auth/scope";
import { useT } from "@/lib/i18n/provider";
import { TRIAL_DAYS } from "@/lib/trial/trial";
import { useTrial } from "@/lib/trial/provider";

export function TrialGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const trial = useTrial();
  const auth = useAuth();
  const user = useActiveUser();
  /** Verlaengern darf nur die Administration; alle anderen nehmen Kontakt auf. */
  const isAdmin = user?.role === "superadmin" || user?.role === "orgadmin";

  if (!trial.ready || !trial.expired) return <>{children}</>;

  const subject = encodeURIComponent(t("trial.contactMail"));
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg" data-testid="trial-expired">
        <CardHeader className="items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- Markenzeichen aus dem Paket */}
          <img
            src={BRAND_MARK_SRC}
            alt=""
            className="mx-auto size-12 object-contain"
          />
          <CardTitle className="text-xl text-primary">
            {t("trial.expiredTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t("trial.expiredText")}
          </p>
          <p className="text-sm text-muted-foreground">{t("trial.noCard")}</p>
          <Button asChild data-testid="trial-contact">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`}>
              <Mail className="size-4" aria-hidden />
              {t("trial.extend")}
            </a>
          </Button>
          {isAdmin ? (
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
          {auth.enabled && auth.user ? (
            <Button variant="ghost" onClick={() => void auth.signOut()}>
              {t("trial.signOut")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
