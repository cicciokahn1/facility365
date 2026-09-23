"use client";

/**
 * Kalender.
 *
 * Monatsraster mit den Terminen aus Auftraegen und Wartungen, darunter die
 * Liste des gewaehlten Tages und die naechsten Termine. Zusaetzlich lassen sich
 * eigene Termine erfassen, bearbeiten und loeschen; mehrere Termine koennen
 * gemeinsam verschoben oder in den Papierkorb gelegt werden.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CalendarArrowDown,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileSignature,
  FileText,
  type LucideIcon,
  Pencil,
  Plus,
  Repeat,
  SprayCan,
  Sun,
  Trash2,
  Truck,
  Wrench,
  Package,
  X,
  Zap,
  FlameKindling,
  Headset,
  ToyBrick,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { CalendarBulkDialog } from "@/components/modules/calendar-bulk-dialog";
import { WorkPlanView } from "@/components/modules/work-plan-view";
import { EntityForm } from "@/components/module/entity-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccess } from "@/lib/auth/scope";
import { CalendarEvent, CalendarEventKind } from "@/lib/calendar/events";
import { useCalendarMutations } from "@/lib/calendar/mutations";
import { useRelevantEvents } from "@/lib/calendar/relevant";
import { useCollection, useEntityIndex } from "@/lib/data/store";
import { valuesOf } from "@/lib/entity-values";
import { useT } from "@/lib/i18n/provider";
import { downloadText } from "@/lib/integrations/csv";
import { toIcs } from "@/lib/integrations/ics";
import { configOf } from "@/lib/module-config";
import { usePushPermission } from "@/lib/notifications/reminders";
import { FieldDef, FormValues } from "@/lib/schema";
import { useSettings } from "@/lib/settings/provider";
import { cn } from "@/lib/utils";
import { formatDate, today } from "@/lib/utils/format";

const WEEKDAY_KEYS = [
  "calendar.mon",
  "calendar.tue",
  "calendar.wed",
  "calendar.thu",
  "calendar.fri",
  "calendar.sat",
  "calendar.sun",
] as const;

/** Symbol je Terminart. */
const EVENT_ICONS: Record<CalendarEventKind, LucideIcon> = {
  appointment: CalendarClock,
  order: ClipboardList,
  maintenance: Wrench,
  legionella: Droplets,
  rcd: Zap,
  inspection: ClipboardCheck,
  playground: ToyBrick,
  fire: FlameKindling,
  vehicle: Truck,
  document: FileText,
  assetWarranty: Wrench,
  inventoryWarranty: Package,
  contract: FileSignature,
  solar: Sun,
  cleaning: SprayCan,
  ticket: Headset,
};

const iso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Sechs Wochen ab Montag, damit das Raster nicht springt. */
const gridOf = (year: number, month: number): string[] => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return iso(day);
  });
};

/** Leere Formularwerte eines Moduls. */
const emptyValues = (fields: FieldDef[]): FormValues => {
  const values: FormValues = {};
  fields.forEach((field) => {
    if (field.kind === "select")
      values[field.name] = field.options[0]?.value ?? "";
    else if (field.kind === "switch") values[field.name] = false;
    else values[field.name] = "";
  });
  return values;
};

export function CalendarView() {
  const t = useT();
  const { settings } = useSettings();
  const events = useRelevantEvents();
  const push = usePushPermission();
  const access = useAccess();
  const mutations = useCalendarMutations();
  const appointments = useCollection("appointments");
  const appointmentConfig = configOf("appointments");
  const mayCreate = access.canWrite("appointments");

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [workPlanOpen, setWorkPlanOpen] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState(today());

  const days = useMemo(() => gridOf(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Intl.DateTimeFormat(
    { de: "de-CH", fr: "fr-CH", it: "it-CH", en: "en-CH" }[settings.language],
    { month: "long", year: "numeric" },
  ).format(new Date(cursor.year, cursor.month, 1));

  /** Termine einmal nach Tag gruppieren statt je Rasterfeld zu durchsuchen. */
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    });
    return map;
  }, [events]);

  const upcoming = useMemo(
    () => events.filter((event) => event.date >= today()).slice(0, 12),
    [events],
  );
  const dayEvents = byDay.get(selected) ?? [];

  /** Ausgewaehlte Termine; nur Datensaetze mit Schreibrecht sind waehlbar. */
  const selectable = useMemo(
    () =>
      events.filter(
        (event) => mutations.canEdit(event) || mutations.canRemove(event),
      ),
    [events, mutations],
  );
  const pickedEvents = useMemo(
    () => selectable.filter((event) => picked.includes(event.id)),
    [picked, selectable],
  );

  const toggle = (event: CalendarEvent) =>
    setPicked((current) =>
      current.includes(event.id)
        ? current.filter((id) => id !== event.id)
        : [...current, event.id],
    );

  const editing = editId ? appointments.get(editId) : undefined;

  const createAppointment = (values: FormValues) => {
    appointments.create(
      values as never,
      settings.profileName || settings.companyName,
    );
    toast.success(t("toast.created"));
  };

  const saveAppointment = (values: FormValues) => {
    if (!editId) return;
    appointments.update(editId, values as never);
    setEditId("");
    toast.success(t("toast.saved"));
  };

  const removeEvent = (event: CalendarEvent) => {
    mutations.remove(event);
    setPicked((current) => current.filter((id) => id !== event.id));
    toast.success(t("toast.deleted"));
  };

  if (workPlanOpen) {
    return <WorkPlanView onBack={() => setWorkPlanOpen(false)} />;
  }

  const step = (delta: number) =>
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("module.calendar")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("calendar.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setWorkPlanOpen(true)}
            data-testid="calendar-work-plan"
          >
            Arbeitsplan
          </Button>
          {mayCreate ? (
            <Button
              size="sm"
              onClick={() => setFormOpen(true)}
              data-testid="calendar-new"
            >
              <Plus className="size-4" aria-hidden />
              {t("calendar.newEvent")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={selectMode ? "default" : "outline"}
            onClick={() => {
              setSelectMode((current) => !current);
              setPicked([]);
            }}
            data-testid="calendar-select-mode"
          >
            <CheckSquare className="size-4" aria-hidden />
            {selectMode ? t("calendar.selectionEnd") : t("calendar.select")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const name = settings.companyName || t("app.name");
              downloadText(
                toIcs(events, name, window.location.origin),
                "facility365.ics",
                "text/calendar",
              );
              toast.success(t("exchange.calendarExported"));
            }}
            data-testid="calendar-export"
          >
            <CalendarArrowDown className="size-4" aria-hidden />
            {t("exchange.calendarExport")}
          </Button>
          <Button
            size="sm"
            variant={push.permission === "granted" ? "outline" : "default"}
            onClick={async () => {
              if (push.install) {
                toast.info(t("notify.installTitle"), {
                  description: t("notify.installHint"),
                });
                return;
              }
              const result = await push.request();
              if (result === "granted") toast.success(t("notify.enabled"));
              else if (result === "denied") toast.error(t("notify.denied"));
              else toast.info(t("notify.unsupported"));
            }}
            data-testid="notifications-enable"
          >
            {push.permission === "granted" ? (
              <BellRing className="size-4" aria-hidden />
            ) : (
              <Bell className="size-4" aria-hidden />
            )}
            {push.permission === "granted"
              ? t("notify.active")
              : t("notify.enable")}
          </Button>
        </div>
      </header>

      {push.install ? (
        <p
          className="rounded-xl border bg-card p-3 text-sm text-muted-foreground"
          data-testid="notify-install-hint"
        >
          {t("notify.installHint")}
        </p>
      ) : null}

      <section
        className="rounded-xl border bg-card p-3"
        data-testid="calendar-grid"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step(-1)}
            aria-label={t("calendar.previous")}
            data-testid="calendar-prev"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
          <span className="text-sm font-semibold" data-testid="calendar-month">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => step(1)}
            aria-label={t("calendar.next")}
            data-testid="calendar-next"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAY_KEYS.map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const count = byDay.get(day)?.length ?? 0;
            const inMonth = Number(day.slice(5, 7)) === cursor.month + 1;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                data-testid="calendar-day"
                data-day={day}
                data-count={count}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors",
                  inMonth
                    ? "bg-background"
                    : "bg-muted/40 text-muted-foreground",
                  day === today() && "border-primary",
                  day === selected && "ring-2 ring-primary",
                )}
              >
                <span>{Number(day.slice(8, 10))}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section data-testid="calendar-day-list">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {formatDate(selected, settings.language)}
        </h2>
        {dayEvents.length === 0 ? (
          <EmptyState titleKey="calendar.noEvents" />
        ) : (
          <ul className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                selectMode={selectMode}
                checked={picked.includes(event.id)}
                selectable={selectable.some((item) => item.id === event.id)}
                onToggle={toggle}
                onEdit={setEditId}
                onRemove={removeEvent}
                mutations={mutations}
              />
            ))}
          </ul>
        )}
      </section>

      <section data-testid="calendar-upcoming">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("calendar.upcoming")}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState titleKey="calendar.noEvents" />
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                showDate
                selectMode={selectMode}
                checked={picked.includes(event.id)}
                selectable={selectable.some((item) => item.id === event.id)}
                onToggle={toggle}
                onEdit={setEditId}
                onRemove={removeEvent}
                mutations={mutations}
              />
            ))}
          </ul>
        )}
      </section>

      {selectMode ? (
        <div
          className="sticky bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-lg"
          data-testid="calendar-selection-bar"
        >
          <span className="text-sm font-medium">
            {pickedEvents.length} {t("calendar.selected")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setPicked(
                dayEvents
                  .filter((event) =>
                    selectable.some((item) => item.id === event.id),
                  )
                  .map((event) => event.id),
              )
            }
            data-testid="calendar-select-day"
          >
            {t("bulk.selectAll")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
            <X className="size-4" aria-hidden />
            {t("calendar.selectionClear")}
          </Button>
          <Button
            size="sm"
            disabled={pickedEvents.length === 0}
            onClick={() => setBulkOpen(true)}
            data-testid="calendar-bulk-edit"
          >
            <Pencil className="size-4" aria-hidden />
            {t("calendar.bulkEdit")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pickedEvents.every(
              (event) => !mutations.canRemove(event),
            )}
            onClick={() => {
              const removable = pickedEvents.filter((event) =>
                mutations.canRemove(event),
              );
              if (removable.length === 0) return;
              if (!window.confirm(t("calendar.bulkDeleteConfirm"))) return;
              removable.forEach((event) => mutations.remove(event));
              setPicked([]);
              toast.success(t("toast.deleted"));
            }}
            data-testid="calendar-bulk-delete"
          >
            <Trash2 className="size-4" aria-hidden />
            {t("action.delete")}
          </Button>
        </div>
      ) : null}

      <CalendarBulkDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        events={pickedEvents}
        mutations={mutations}
        onDone={() => setPicked([])}
      />

      <EntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`${t("action.new")} · ${t("module.appointments.singular")}`}
        fields={appointmentConfig.fields}
        initialValues={{
          ...emptyValues(appointmentConfig.fields),
          date: selected,
        }}
        onSubmit={createAppointment}
      />

      <EntityForm
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditId("");
        }}
        title={`${t("action.edit")} · ${t("module.appointments.singular")}`}
        fields={appointmentConfig.fields}
        initialValues={editing ? valuesOf(editing) : {}}
        onSubmit={saveAppointment}
      />
    </div>
  );
}

function EventRow({
  event,
  showDate = false,
  selectMode = false,
  checked = false,
  selectable = false,
  onToggle,
  onEdit,
  onRemove,
  mutations,
}: {
  event: CalendarEvent;
  showDate?: boolean;
  selectMode?: boolean;
  checked?: boolean;
  selectable?: boolean;
  onToggle: (event: CalendarEvent) => void;
  onEdit: (id: string) => void;
  onRemove: (event: CalendarEvent) => void;
  mutations: ReturnType<typeof useCalendarMutations>;
}) {
  const t = useT();
  const { settings } = useSettings();
  const customers = useEntityIndex("customers");
  const properties = useEntityIndex("properties");
  const buildings = useEntityIndex("buildings");
  const assets = useEntityIndex("assets");

  const context = [
    customers.get(event.customerId)?.name,
    properties.get(event.propertyId)?.name,
    buildings.get(event.buildingId)?.name,
    assets.get(event.assetId)?.name,
  ].filter(Boolean);

  const Icon = EVENT_ICONS[event.kind];
  const own = event.kind === "appointment";

  return (
    <li className="flex items-start gap-2 rounded-xl border bg-card p-3 transition-colors hover:border-primary/40">
      {selectMode ? (
        <Checkbox
          className="mt-0.5"
          checked={checked}
          disabled={!selectable}
          onCheckedChange={() => onToggle(event)}
          aria-label={event.title}
          data-testid="calendar-event-select"
        />
      ) : null}
      <Link
        href={event.href}
        data-testid="calendar-event"
        className="flex min-w-0 flex-1 items-start gap-3"
      >
        <Icon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {[
              showDate ? formatDate(event.date, settings.language) : null,
              event.time || null,
              t(event.labelKey),
              ...context,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {event.recurring ? (
          <span
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"
            data-testid="calendar-recurring"
          >
            <Repeat className="size-3.5" aria-hidden />
            {t("calendar.recurring")}
          </span>
        ) : null}
      </Link>
      {!selectMode && own ? (
        <div className="flex shrink-0 items-center gap-1">
          {mutations.canEdit(event) ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("action.edit")}
              onClick={() => onEdit(event.sourceId)}
              data-testid="calendar-event-edit"
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          ) : null}
          {mutations.canRemove(event) ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("action.delete")}
              onClick={() => {
                if (!window.confirm(t("detail.deleteText"))) return;
                onRemove(event);
              }}
              data-testid="calendar-event-delete"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
