"use client";

/**
 * Persoenliche Tagesansicht.
 *
 * Oben, was der angemeldeten Person zugewiesen ist, darunter alles, was heute
 * faellig oder ueberfaellig ist - Auftraege, Wartungen, Reinigungen,
 * Kontrollen und Termine aus dem Kalender.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardCheck, ClipboardList, FileText, ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { DoneButton } from "@/components/module/done-button";
import { QuickDamageDialog } from "@/components/modules/quick-damage-dialog";
import {
  InProgressButton,
  isProgressable,
} from "@/components/module/in-progress-button";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/auth/scope";
import { useRelevantEvents } from "@/lib/calendar/relevant";
import { useCollectionItems } from "@/lib/data/store";
import { fieldValue, stringField } from "@/lib/entity-values";
import { useT } from "@/lib/i18n/provider";
import { titleOfEntity } from "@/lib/module-config";
import { moduleByCollection, moduleByKey } from "@/lib/modules";
import { useSettings } from "@/lib/settings/provider";
import { BaseEntity, CollectionKey } from "@/lib/types";
import { daysUntil, formatDate, today } from "@/lib/utils/format";
import { CompletableKey, isCompletable, isDone } from "@/lib/workflow/complete";

interface Row {
  key: string;
  href: string;
  id: string;
  collection?: CompletableKey;
  status: string;
  label: string;
  title: string;
  date: string;
  overdue: boolean;
  context: string;
  responsible: string;
  checklistCount: number;
  recurring: boolean;
}

const references = (
  properties: BaseEntity[],
  buildings: BaseEntity[],
  rooms: BaseEntity[],
  assets: BaseEntity[],
) => ({ properties, buildings, rooms, assets });

type References = ReturnType<typeof references>;

function contextOf(item: BaseEntity, lookup: References): string {
  const relation =
    stringField(item, "assetId") && lookup.assets.find((entry) => entry.id === stringField(item, "assetId"))
      ? lookup.assets.find((entry) => entry.id === stringField(item, "assetId"))
      : stringField(item, "roomId") && lookup.rooms.find((entry) => entry.id === stringField(item, "roomId"))
        ? lookup.rooms.find((entry) => entry.id === stringField(item, "roomId"))
        : stringField(item, "buildingId") && lookup.buildings.find((entry) => entry.id === stringField(item, "buildingId"))
          ? lookup.buildings.find((entry) => entry.id === stringField(item, "buildingId"))
          : stringField(item, "propertyId") && lookup.properties.find((entry) => entry.id === stringField(item, "propertyId"))
            ? lookup.properties.find((entry) => entry.id === stringField(item, "propertyId"))
            : undefined;
  if (!relation) return "";
  const collection = lookup.assets.includes(relation)
    ? "assets"
    : lookup.rooms.includes(relation)
      ? "rooms"
      : lookup.buildings.includes(relation)
        ? "buildings"
        : "properties";
  return titleOfEntity(collection, relation);
}

function detailsOf(item: BaseEntity, lookup: References) {
  const checklist = fieldValue(item, "checklist");
  return {
    context: contextOf(item, lookup),
    responsible:
      stringField(item, "assignee") ||
      stringField(item, "responsible") ||
      stringField(item, "assigneeTeam") ||
      stringField(item, "company") ||
      stringField(item, "cleanerId"),
    checklistCount: Array.isArray(checklist) ? checklist.length : 0,
  };
}

function sourceForEvent(
  collection: CollectionKey,
  sourceId: string,
  sources: {
    orders: BaseEntity[];
    maintenances: BaseEntity[];
    legionella: BaseEntity[];
    rcd: BaseEntity[];
    inspections: BaseEntity[];
    cleaningtasks: BaseEntity[];
    tickets: BaseEntity[];
  },
): BaseEntity | undefined {
  const items =
    collection === "orders"
      ? sources.orders
      : collection === "maintenances"
        ? sources.maintenances
        : collection === "legionella"
          ? sources.legionella
          : collection === "rcd"
            ? sources.rcd
            : collection === "inspections"
              ? sources.inspections
              : collection === "cleaningtasks"
                ? sources.cleaningtasks
                : collection === "tickets"
                  ? sources.tickets
                  : [];
  return items.find((item) => item.id === sourceId);
}

/** Sammlungen, die eine persoenliche Zuweisung kennen. */
const ASSIGNABLE: CompletableKey[] = [
  "orders",
  "maintenances",
  "damages",
  "cleaningtasks",
  "inspections",
  "firechecks",
  "playgroundchecks",
  "rcd",
  "tickets",
];

export function TodayView() {
  const t = useT();
  const [quickReportOpen, setQuickReportOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "overdue" | "today">("all");
  const access = useAccess();
  const { settings } = useSettings();
  const day = today();
  const events = useRelevantEvents();
  const orders = useCollectionItems("orders");
  const maintenances = useCollectionItems("maintenances");
  const damages = useCollectionItems("damages");
  const cleaningtasks = useCollectionItems("cleaningtasks");
  const inspections = useCollectionItems("inspections");
  const firechecks = useCollectionItems("firechecks");
  const playgroundchecks = useCollectionItems("playgroundchecks");
  const rcd = useCollectionItems("rcd");
  const tickets = useCollectionItems("tickets");
  const properties = useCollectionItems("properties");
  const buildings = useCollectionItems("buildings");
  const rooms = useCollectionItems("rooms");
  const assets = useCollectionItems("assets");
  const lookup = useMemo(
    () => references(properties, buildings, rooms, assets),
    [assets, buildings, properties, rooms],
  );

  const assigned = useMemo(() => {
    const userId = access.user?.id ?? "";
    if (!userId) return [];
    const byCollection: Record<CompletableKey, BaseEntity[]> = {
      orders,
      maintenances,
      damages,
      cleaningtasks,
      inspections,
      firechecks,
      playgroundchecks,
      rcd,
      tickets,
    };
    const rows: Row[] = [];
    ASSIGNABLE.forEach((collection) => {
      if (!access.canRead(collection)) return;
      byCollection[collection]
        .filter((item) => stringField(item, "assigneeUserId") === userId)
        .filter((item) => !isDone(collection, stringField(item, "status")))
        .filter((item) => access.visible(collection, item))
        .forEach((item) => {
          const date =
            stringField(item, "dueDate") ||
            stringField(item, "nextDate") ||
            stringField(item, "date") ||
            "";
          rows.push({
            key: `${collection}-${item.id}`,
            href: `${moduleByCollection(collection).path}/${item.id}`,
            id: item.id,
            collection,
            label: t(moduleByCollection(collection).singularKey),
            title: titleOfEntity(collection, item),
            status: stringField(item, "status"),
            date,
            overdue: Boolean(date) && date < day,
            ...detailsOf(item, lookup),
            recurring: false,
          });
        });
    });
    return rows.sort((a, b) =>
      (a.date || "9999").localeCompare(b.date || "9999"),
    );
  }, [
    access,
    cleaningtasks,
    damages,
    day,
    firechecks,
    inspections,
    maintenances,
    orders,
    playgroundchecks,
    rcd,
    t,
    tickets,
    lookup,
  ]);

  const due = useMemo(
    () =>
      events
        .filter((event) => event.date <= day)
        .filter((event) => !assigned.some((row) => row.href === event.href))
        .map((event) => {
          const source = event.source?.collection
            ? sourceForEvent(event.source.collection, event.sourceId, {
                orders,
                maintenances,
                legionella: [],
                rcd,
                inspections,
                cleaningtasks,
                tickets,
              })
            : undefined;
          return {
            key: event.id,
            href: event.href,
            id: event.sourceId,
            collection:
              event.source?.collection && isCompletable(event.source.collection)
                ? event.source.collection
                : undefined,
            status: source ? stringField(source, "status") : "",
            label: t(event.labelKey),
            title: event.title,
            date: event.date,
            overdue: event.date < day,
            ...(source ? detailsOf(source, lookup) : {
              context: "",
              responsible: "",
              checklistCount: 0,
            }),
            recurring: event.recurring,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [assigned, cleaningtasks, day, events, inspections, lookup, maintenances, orders, rcd, tickets, t],
  );

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.date > day)
        .filter((event) => !assigned.some((row) => row.href === event.href))
        .map((event) => ({
          key: event.id,
          href: event.href,
          id: event.sourceId,
          collection:
            event.source?.collection && isCompletable(event.source.collection)
              ? event.source.collection
              : undefined,
          status: "",
          label: t(event.labelKey),
          title: event.title,
          date: event.date,
          overdue: false,
          context: "",
          responsible: "",
          checklistCount: 0,
          recurring: event.recurring,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 12),
    [assigned, day, events, t],
  );

  const nowRows = [...assigned, ...due].filter((row) => !row.date || row.date < day);
  const todayRows = [...assigned, ...due].filter((row) => row.date === day);
  const nextRows = [...assigned, ...upcoming].filter(
    (row) => {
      const days = daysUntil(row.date);
      return days !== null && days > 0 && days <= 7;
    },
  );
  const laterRows = [...assigned, ...upcoming].filter(
    (row) => row.date > day && !nextRows.some((next) => next.key === row.key),
  );
  const empty = nowRows.length === 0 && todayRows.length === 0 && nextRows.length === 0 && laterRows.length === 0;
  const showNow = filter !== "today";
  const showToday = filter !== "overdue";
  const showFuture = filter === "all";
  const filteredEmpty =
    filter === "overdue"
      ? nowRows.length === 0
      : filter === "today"
        ? todayRows.length === 0
        : empty;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("today.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("today.hint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex" data-testid="today-quick-actions">
            <Button
              size="sm"
              onClick={() => setEmergencyOpen(true)}
              variant="destructive"
              className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-xs sm:h-9 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <AlertTriangle className="size-4" aria-hidden />
              <span className="leading-tight">Notfall</span>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-xs sm:h-9 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <Link href="/orders?new=1">
                <ClipboardList className="size-4" aria-hidden />
                <span className="leading-tight">{t("dashboard.quick.order")}</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setQuickReportOpen(true)}
              variant="outline"
              className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-xs sm:h-9 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <>
                <ShieldAlert className="size-4" aria-hidden />
                <span className="leading-tight">Störung melden</span>
              </>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-xs sm:h-9 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <Link href="/reports?new=1">
                <FileText className="size-4" aria-hidden />
                <span className="leading-tight">{t("dashboard.quick.report")}</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-auto min-h-14 flex-col gap-1 px-2 py-2 text-xs sm:h-9 sm:flex-row sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <Link href="/walkthrough">
                <ClipboardCheck className="size-4" aria-hidden />
                <span className="leading-tight">{t("module.walkthrough")}</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={t("today.title")}>
          {([
            ["all", t("common.all")],
            ["overdue", t("notify.overdue")],
            ["today", t("today.today")],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={filter === value ? "default" : "outline"}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </header>
      <QuickDamageDialog
        open={quickReportOpen}
        onOpenChange={setQuickReportOpen}
        target={null}
        standalone
      />
      <QuickDamageDialog
        open={emergencyOpen}
        onOpenChange={setEmergencyOpen}
        target={null}
        standalone
        emergency
      />

      {filteredEmpty ? (
        <EmptyState icon={moduleByKey("today").icon} titleKey="today.empty" />
      ) : (
        <>
          {showNow ? (
            <Section testId="today-now" title={t("today.now")} rows={nowRows} language={settings.language} />
          ) : null}
          {showToday ? (
            <Section testId="today-today" title={t("today.today")} rows={todayRows} language={settings.language} />
          ) : null}
          {showFuture ? (
            <>
              <Section testId="today-next" title={t("today.next")} rows={nextRows} language={settings.language} />
              <Section testId="today-later" title={t("today.later")} rows={laterRows} language={settings.language} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function Section({
  testId,
  title,
  rows,
  language,
}: {
  testId: string;
  title: string;
  rows: Row[];
  language: Parameters<typeof formatDate>[1];
}) {
  const t = useT();
  if (rows.length === 0) return null;
  return (
    <section data-testid={testId} className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} <span className="font-normal">({rows.length})</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex min-h-16 flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-base hover:border-primary/40">
              <Link
                href={row.href}
                aria-label={`${row.title} · ${row.label}`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 px-1 py-1"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{row.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.label}
                    {row.context ? ` · ${row.context}` : ""}
                    {row.responsible ? ` · ${row.responsible}` : ""}
                    {row.checklistCount > 0 ? ` · ${t("today.checklist", { n: row.checklistCount })}` : ""}
                    {row.recurring ? ` · ${t("today.recurring")}` : ""}
                  </span>
                </span>
                <span
                  className={
                    row.overdue
                      ? "text-xs text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {row.date ? formatDate(row.date, language) : ""}
                  {row.overdue ? ` · ${t("notify.overdue")}` : ""}
                </span>
              </Link>
              {row.collection && isProgressable(row.collection) ? (
                <InProgressButton
                  collection={row.collection}
                  id={row.id}
                  status={row.status}
                  compact
                />
              ) : null}
              {row.collection ? (
                <DoneButton collection={row.collection} id={row.id} status="" compact />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
