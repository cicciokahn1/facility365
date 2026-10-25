"use client";

/**
 * Pikettdienst-Uebersicht.
 *
 * Zeigt den aktuell zustaendigen Pikettmitarbeiter, den naechsten Dienst,
 * neue bzw. laufende Meldungen und den Schnelleinstieg zum Melden.
 * Ohne geplante Perioden wird klar «Kein Pikett geplant» angezeigt.
 */
import Link from "next/link";
import { useMemo } from "react";
import { CalendarClock, MessageSquareWarning, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/lib/auth/scope";
import { useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { AppUser, OncallIncident, OncallPeriod } from "@/lib/types";

const OPEN_STATUSES: OncallIncident["status"][] = [
  "unverified",
  "new",
  "verified",
];
const ACTIVE_STATUSES: OncallIncident["status"][] = [
  "assigned",
  "in_progress",
];

const userName = (users: AppUser[], id: string): string =>
  users.find((user) => user.id === id)?.name ?? "";

const fmt = (iso: string): string => (iso ? new Date(iso).toLocaleString() : "");

export function OncallOverview() {
  const t = useT();
  const access = useAccess();
  const periods = useCollectionItems("oncallperiods");
  const incidents = useCollectionItems("oncallincidents");
  const users = useCollectionItems("users");
  const now = new Date().toISOString();

  const { current, next } = useMemo(() => {
    const live = periods
      .filter((period) => !period.deletedAt)
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
    return {
      current: live.find((p) => p.startAt <= now && p.endAt >= now),
      next: live.find((p) => p.startAt > now),
    };
  }, [periods, now]);

  const visible = useMemo(
    () =>
      incidents.filter(
        (incident) =>
          !incident.deletedAt && access.visible("oncallincidents", incident),
      ),
    [access, incidents],
  );
  const fresh = visible.filter((i) => OPEN_STATUSES.includes(i.status));
  const running = visible.filter((i) => ACTIVE_STATUSES.includes(i.status));
  const done = visible
    .filter((i) => i.status === "done")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("oncall.overview.currentDuty")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {current ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {userName(users, current.assigneeUserId) ||
                    current.assigneeUserId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fmt(current.startAt)} – {fmt(current.endAt)}
                </p>
                {current.deputyUserId && (
                  <p className="text-sm text-muted-foreground">
                    {t("oncall.deputy")}:{" "}
                    {userName(users, current.deputyUserId)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t("oncall.overview.noPeriod")}
              </p>
            )}
            {next && (
              <p className="mt-3 text-sm">
                {t("oncall.overview.nextPeriod")}:{" "}
                {userName(users, next.assigneeUserId)} · {fmt(next.startAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("oncall.overview.newIncidents")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{fresh.length}</p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/oncall/incidents?new=1">
                <Plus className="mr-1 size-4" />
                {t("oncall.overview.newIncident")}
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="ml-2 mt-2">
              <Link href="/oncall/plan">
                <CalendarClock className="mr-1 size-4" />
                {t("module.oncallperiods")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("oncall.overview.running")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {running.length === 0 && (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {running.map((incident) => (
              <Link
                key={incident.id}
                href="/oncall/incidents"
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <span>
                  {incident.number} · {incident.title}
                </span>
                <Badge variant="secondary">{incident.urgency}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("oncall.overview.recentDone")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {done.length === 0 && (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {done.map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {incident.number} · {incident.title}
                </span>
                <MessageSquareWarning className="size-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
