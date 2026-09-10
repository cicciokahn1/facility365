"use client";

/**
 * Helpdesk-Uebersicht.
 *
 * Drei schnelle Sichten - offen, ueberfaellig und erledigt - ueber der
 * gewohnten Modulliste mit Suche, Filter und Sortierung.
 */
import { useCallback, useMemo, useState } from "react";

import { CLOSED_FILTER, ModuleList } from "@/components/module/module-list";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/auth/scope";
import { useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { BaseEntity, Ticket } from "@/lib/types";
import { today } from "@/lib/utils/format";

type View = "open" | "overdue" | "done";

const CLOSED: readonly string[] = ["done", "closed"];

const isOverdue = (ticket: Ticket, day: string): boolean =>
  Boolean(ticket.dueDate) &&
  ticket.dueDate < day &&
  !CLOSED.includes(ticket.status);

export function TicketList() {
  const t = useT();
  const access = useAccess();
  const all = useCollectionItems("tickets");
  const day = today();
  const [view, setView] = useState<View>("open");

  /** Nur Tickets des eigenen Sichtbereichs zaehlen; die Rolle entscheidet. */
  const counts = useMemo(() => {
    const tickets = all.filter((ticket) => access.visible("tickets", ticket));
    return {
      open: tickets.filter((ticket) => !CLOSED.includes(ticket.status)).length,
      overdue: tickets.filter((ticket) => isOverdue(ticket, day)).length,
      done: tickets.filter((ticket) => CLOSED.includes(ticket.status)).length,
    };
  }, [access, all, day]);

  const overdueFilter = useCallback(
    (item: BaseEntity) => isOverdue(item as Ticket, day),
    [day],
  );

  const views: { key: View; label: string; count: number }[] = [
    { key: "open", label: t("list.filter.open"), count: counts.open },
    { key: "overdue", label: t("status.overdue"), count: counts.overdue },
    { key: "done", label: t("status.done"), count: counts.done },
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
            data-testid={`ticket-view-${entry.key}`}
            className="shrink-0 rounded-full"
          >
            {entry.label}
            <span className="ml-1 text-xs opacity-80">{entry.count}</span>
          </Button>
        ))}
      </div>

      {view === "open" ? (
        <ModuleList key="open" collection="tickets" />
      ) : view === "overdue" ? (
        <ModuleList
          key="overdue"
          collection="tickets"
          initialStatus="all"
          extraFilter={overdueFilter}
        />
      ) : (
        <ModuleList
          key="done"
          collection="tickets"
          initialStatus={CLOSED_FILTER}
        />
      )}
    </div>
  );
}
