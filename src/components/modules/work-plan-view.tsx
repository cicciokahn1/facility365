"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Printer, Plus } from "lucide-react";

import { EntityForm } from "@/components/module/entity-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccess } from "@/lib/auth/scope";
import { useCollection, useCollectionItems } from "@/lib/data/store";
import { formatWorkTime, workedHours } from "@/lib/reports/work-time";
import { configOf } from "@/lib/module-config";
import { useSettings } from "@/lib/settings/provider";
import { FormValues } from "@/lib/schema";
import { Appointment, CleaningTask } from "@/lib/types";

type PlanItem = {
  id: string;
  source: "appointment" | "cleaning";
  title: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  breakMinutes: number;
  assigneeUserId: string;
  assignee: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  status: string;
  weeklyRepeat: boolean;
};

const iso = (date: Date): string => date.toISOString().slice(0, 10);

const mondayOf = (value: Date): Date => {
  const date = new Date(value);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(12, 0, 0, 0);
  return date;
};

const addDays = (value: string, amount: number): string => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return iso(date);
};

const nameOf = (
  id: string,
  items: { id: string; name?: string; title?: string; roomNumber?: string }[],
): string => {
  const item = items.find((entry) => entry.id === id);
  return item?.name || item?.title || item?.roomNumber || "";
};

export function WorkPlanView({ onBack }: { onBack: () => void }) {
  const access = useAccess();
  const { settings } = useSettings();
  const appointments = useCollection("appointments");
  const cleaningtasks = useCollection("cleaningtasks");
  const appointmentItems = useCollectionItems("appointments");
  const cleaningItems = useCollectionItems("cleaningtasks");
  const users = useCollectionItems("users");
  const properties = useCollectionItems("properties");
  const buildings = useCollectionItems("buildings");
  const rooms = useCollectionItems("rooms");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [employee, setEmployee] = useState("all");
  const [property, setProperty] = useState("all");
  const [viewMode, setViewMode] = useState<"week" | "day" | "employee">("week");
  const [focusDay, setFocusDay] = useState(() => iso(new Date()));
  const [formOpen, setFormOpen] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(iso(weekStart), index)),
    [weekStart],
  );

  const items = useMemo<PlanItem[]>(
    () => [
      ...appointmentItems.map((item: Appointment) => ({
        id: item.id,
        source: "appointment" as const,
        title: item.title || item.number,
        date: item.date,
        timeStart: item.timeStart,
        timeEnd: item.timeEnd,
        breakMinutes: item.breakMinutes ?? 0,
        assigneeUserId: item.assigneeUserId,
        assignee: item.assignee,
        propertyId: item.propertyId,
        buildingId: item.buildingId,
        roomId: item.roomId,
        status: item.status,
        weeklyRepeat: item.weeklyRepeat ?? false,
      })),
      ...cleaningItems.map((item: CleaningTask) => ({
        id: item.id,
        source: "cleaning" as const,
        title: item.title || item.number,
        date: item.date,
        timeStart: item.workStart,
        timeEnd: item.workEnd,
        breakMinutes: item.breakMinutes ?? 0,
        assigneeUserId: item.assigneeUserId,
        assignee: item.cleanerId,
        propertyId: item.propertyId,
        buildingId: item.buildingId,
        roomId: item.roomId,
        status: item.status,
        weeklyRepeat: false,
      })),
    ],
    [appointmentItems, cleaningItems],
  );

  const displayDays = viewMode === "day" ? [focusDay] : days;
  const visibleItems = items.filter(
    (item) =>
      displayDays.includes(item.date) &&
      (employee === "all" || item.assigneeUserId === employee) &&
      (property === "all" || item.propertyId === property),
  );

  const conflicts = useMemo(() => {
    const result = new Set<string>();
    visibleItems.forEach((left, index) => {
      if (!left.assigneeUserId || !left.timeStart || !left.timeEnd) return;
      const leftStart = left.timeStart.replace(":", "");
      const leftEnd = left.timeEnd.replace(":", "");
      visibleItems.slice(index + 1).forEach((right) => {
        if (
          right.date === left.date &&
          right.assigneeUserId === left.assigneeUserId &&
          right.timeStart &&
          right.timeEnd &&
          right.timeStart.replace(":", "") < leftEnd &&
          right.timeEnd.replace(":", "") > leftStart
        ) {
          result.add(left.id);
          result.add(right.id);
        }
      });
    });
    return result;
  }, [visibleItems]);

  const updateItem = (item: PlanItem, values: Partial<Appointment & CleaningTask>) => {
    if (item.source === "appointment") appointments.update(item.id, values);
    else cleaningtasks.update(item.id, values);
  };

  const copyItem = (item: PlanItem, date = item.date) => {
    if (item.source === "appointment") {
      const source = appointmentItems.find((entry) => entry.id === item.id);
      if (source) appointments.create({ ...source, date, title: `${source.title} (Kopie)` });
    } else {
      const source = cleaningItems.find((entry) => entry.id === item.id);
      if (source) cleaningtasks.create({ ...source, date, title: `${source.title} (Kopie)` });
    }
    toast.success("Einsatz kopiert");
  };

  const copyWeek = () => {
    visibleItems.filter((item) => item.weeklyRepeat || item.source === "cleaning").forEach((item) => {
      copyItem(item, addDays(item.date, 7));
    });
    toast.success("Wiederholungen für nächste Woche erstellt");
  };

  const createAppointment = (values: FormValues) => {
    appointments.create(values as Partial<Appointment>, settings.profileName || settings.companyName);
    setFormOpen(false);
    toast.success("Einsatz gespeichert");
  };

  const print = (size: "A4" | "A3") => {
    const rows = visibleItems
      .map((item) => {
        const person = nameOf(item.assigneeUserId, users);
        const place = [nameOf(item.propertyId, properties), nameOf(item.buildingId, buildings), nameOf(item.roomId, rooms)]
          .filter(Boolean)
          .join(" / ");
        return `<tr><td>${item.date}</td><td>${item.timeStart || "–"}–${item.timeEnd || "–"}</td><td>${item.title}</td><td>${person || item.assignee || "–"}</td><td>${place || "–"}</td><td>${item.status === "done" ? "Erledigt" : "Offen"}</td></tr>`;
      })
      .join("");
    const popup = window.open("", "_blank", "width=1200,height=800");
    if (!popup) return;
    popup.document.write(`<html><head><title>Arbeitsplan</title><style>@page{size:${size} landscape;margin:10mm}body{font:12px Arial;color:#172b4d}h1{font-size:22px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #b8c2cc;padding:7px;text-align:left}th{background:#eaf0f5}</style></head><body><h1>Wochen-Arbeitsplan</h1><p>Woche ab ${iso(weekStart)}</p><table><thead><tr><th>Tag</th><th>Zeit</th><th>Aufgabe</th><th>Mitarbeiter</th><th>Ort</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div data-work-plan className="flex flex-col gap-4">
      <header data-hide-print className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Zurück">
            <ArrowLeft className="size-4" aria-hidden />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wochen-Arbeitsplan</h1>
            <p className="text-sm text-muted-foreground">Einsätze planen, verschieben und erledigen</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {access.canWrite("appointments") ? (
            <Button size="lg" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" aria-hidden /> Neuer Einsatz
            </Button>
          ) : null}
          <Button variant="outline" onClick={copyWeek}>
            <Copy className="size-4" aria-hidden /> Woche kopieren
          </Button>
          <Button variant="outline" onClick={() => print("A4")}>
            <Printer className="size-4" aria-hidden /> A4 / PDF
          </Button>
          <Button variant="outline" onClick={() => print("A3")}>A3</Button>
        </div>
      </header>

      <section data-hide-print className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Button variant="outline" size="icon" onClick={() => setWeekStart((date) => new Date(date.getTime() - 7 * 86400000))}><ChevronLeft className="size-4" aria-hidden /></Button>
        <Button variant="outline" onClick={() => setWeekStart(mondayOf(new Date()))}>Diese Woche</Button>
        <Button variant="outline" size="icon" onClick={() => setWeekStart((date) => new Date(date.getTime() + 7 * 86400000))}><ChevronRight className="size-4" aria-hidden /></Button>
        <Input type="date" value={iso(weekStart)} onChange={(event) => setWeekStart(mondayOf(new Date(`${event.target.value}T12:00:00`)))} className="h-11 w-40" />
        <Select value={employee} onValueChange={setEmployee}>
          <SelectTrigger className="h-11 w-52"><SelectValue placeholder="Mitarbeiter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mitarbeiter</SelectItem>
            {users.filter((user) => user.status === "active").map((user) => <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={property} onValueChange={setProperty}>
          <SelectTrigger className="h-11 w-52"><SelectValue placeholder="Liegenschaft" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Liegenschaften</SelectItem>
            {properties.map((item) => <SelectItem key={item.id} value={item.id}>{item.name || item.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "day" | "employee")}>
          <SelectTrigger className="h-11 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Wochenansicht</SelectItem>
            <SelectItem value="day">Tagesansicht</SelectItem>
            <SelectItem value="employee">Mitarbeiteransicht</SelectItem>
          </SelectContent>
        </Select>
        {viewMode === "day" ? (
          <Input type="date" value={focusDay} onChange={(event) => setFocusDay(event.target.value)} className="h-11 w-40" />
        ) : null}
      </section>

      <section className={`grid min-w-[980px] gap-2 overflow-x-auto print:min-w-0 ${displayDays.length === 1 ? "grid-cols-1" : "grid-cols-7"}`}>
        {displayDays.map((day) => {
          const dayItems = visibleItems.filter((item) => item.date === day);
          const date = new Date(`${day}T12:00:00`);
          return (
            <div
              key={day}
              className="min-h-[30rem] rounded-xl border bg-muted/30 p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const payload = event.dataTransfer.getData("text/plain").split(":");
                const item = visibleItems.find((entry) => entry.source === payload[0] && entry.id === payload[1]);
                if (item) updateItem(item, { date: day });
              }}
            >
              <header className="mb-2 border-b pb-2 text-center">
                <div className="text-xs font-semibold uppercase text-muted-foreground">{date.toLocaleDateString("de-CH", { weekday: "short" })}</div>
                <div className="text-lg font-semibold">{date.getDate()}.{date.getMonth() + 1}.</div>
              </header>
              <div className="flex flex-col gap-2">
                {dayItems.map((item) => {
                  const conflict = conflicts.has(item.id);
                  const hours = workedHours({ start: item.timeStart, end: item.timeEnd, breakMinutes: item.breakMinutes });
                  return (
                    <article
                      key={`${item.source}-${item.id}`}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", `${item.source}:${item.id}`)}
                      className={`rounded-lg border bg-card p-3 shadow-sm ${conflict ? "border-destructive" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <strong className="line-clamp-2 text-sm">{item.title}</strong>
                        <Button variant="ghost" size="icon-xs" onClick={() => copyItem(item)} aria-label="Kopieren"><Copy className="size-3" aria-hidden /></Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.timeStart || "–"}–{item.timeEnd || "–"} · {hours ? `${hours} h` : "keine Zeit"}</p>
                      <p className="truncate text-xs">{nameOf(item.assigneeUserId, users) || item.assignee || "Nicht zugeordnet"}</p>
                      <p className="truncate text-xs text-muted-foreground">{[nameOf(item.propertyId, properties), nameOf(item.roomId, rooms)].filter(Boolean).join(" · ") || "Ort offen"}</p>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <span className={item.status === "done" ? "text-xs text-success" : conflict ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{item.status === "done" ? "Erledigt" : conflict ? "Überschneidung" : formatWorkTime({ start: item.timeStart, end: item.timeEnd, breakMinutes: item.breakMinutes })}</span>
                        {item.status !== "done" ? <Button size="xs" onClick={() => updateItem(item, { status: "done" })}>Erledigt</Button> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <EntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Neuer Einsatz"
        fields={configOf("appointments").fields}
        initialValues={{ date: iso(weekStart), status: "planned", type: "appointment", breakMinutes: 0, weeklyRepeat: false }}
        onSubmit={createAppointment}
      />
    </div>
  );
}
