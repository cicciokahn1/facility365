"use client";

/**
 * Notfallmeldungen und Einsaetze des Pikettdienstes.
 *
 * Drei Sichten ueber der gewohnten Modulliste: neue/ungepruefte Meldungen,
 * laufende Bearbeitung und Abgeschlossenes. Externe Meldungen starten als
 * «Neu – ungeprueft» und muessen erst geprueft werden.
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CLOSED_FILTER, ModuleList } from "@/components/module/module-list";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/auth/scope";
import { useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { BaseEntity, OncallIncident } from "@/lib/types";

type View = "new" | "active" | "done";

const NEW_STATUSES: readonly string[] = ["unverified", "new"];
const ACTIVE_STATUSES: readonly string[] = [
  "verified",
  "assigned",
  "in_progress",
];
const DONE_STATUSES: readonly string[] = ["done", "aborted"];

const hasStatus = (list: readonly string[]) => (item: BaseEntity) =>
  list.includes((item as OncallIncident).status);

export function OncallIncidents() {
  const t = useT();
  const access = useAccess();
  const all = useCollectionItems("oncallincidents");
  const params = useSearchParams();
  const [view, setView] = useState<View>(
    params.get("new") ? "new" : "new",
  );

  const counts = useMemo(() => {
    const items = all.filter(
      (i) => !i.deletedAt && access.visible("oncallincidents", i),
    );
    return {
      new: items.filter((i) => NEW_STATUSES.includes(i.status)).length,
      active: items.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
      done: items.filter((i) => DONE_STATUSES.includes(i.status)).length,
    };
  }, [access, all]);

  const views: { key: View; label: string; count: number }[] = [
    { key: "new", label: t("oncall.incident.unverifiedTab"), count: counts.new },
    {
      key: "active",
      label: t("oncall.incident.activeTab"),
      count: counts.active,
    },
    { key: "done", label: t("oncall.incident.doneTab"), count: counts.done },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {views.map((entry) => (
          <Button
            key={entry.key}
            size="sm"
            variant={view === entry.key ? "default" : "outline"}
            onClick={() => setView(entry.key)}
            data-testid={`oncall-view-${entry.key}`}
            className="shrink-0 rounded-full"
          >
            {entry.label}
            <span className="ml-1 text-xs opacity-80">{entry.count}</span>
          </Button>
        ))}
      </div>

      {view === "done" ? (
        <ModuleList
          key="done"
          collection="oncallincidents"
          initialStatus={CLOSED_FILTER}
          extraFilter={hasStatus(DONE_STATUSES)}
        />
      ) : (
        <ModuleList
          key={view}
          collection="oncallincidents"
          initialStatus="all"
          extraFilter={
            view === "new"
              ? hasStatus(NEW_STATUSES)
              : hasStatus(ACTIVE_STATUSES)
          }
        />
      )}
    </div>
  );
}
