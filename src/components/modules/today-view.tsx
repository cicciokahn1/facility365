"use client";

/**
 * Persoenliche Tagesansicht.
 *
 * Oben, was der angemeldeten Person zugewiesen ist, darunter alles, was heute
 * faellig oder ueberfaellig ist - Auftraege, Wartungen, Reinigungen,
 * Kontrollen und Termine aus dem Kalender.
 */
import { useMemo } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { useAccess } from "@/lib/auth/scope";
import { useRelevantEvents } from "@/lib/calendar/relevant";
import { useCollectionItems } from "@/lib/data/store";
import { stringField } from "@/lib/entity-values";
import { useT } from "@/lib/i18n/provider";
import { titleOfEntity } from "@/lib/module-config";
import { moduleByCollection, moduleByKey } from "@/lib/modules";
import { useSettings } from "@/lib/settings/provider";
import { BaseEntity, CollectionKey } from "@/lib/types";
import { daysUntil, formatDate, today } from "@/lib/utils/format";
import { CompletableKey, isDone } from "@/lib/workflow/complete";

interface Row {
  key: string;
  href: string;
  label: string;
  title: string;
  date: string;
  overdue: boolean;
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
            label: t(moduleByCollection(collection).singularKey),
            title: titleOfEntity(collection, item),
            date,
            overdue: Boolean(date) && date < day,
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
  ]);

  const due = useMemo(
    () =>
      events
        .filter((event) => event.date <= day)
        .filter((event) => !assigned.some((row) => row.href === event.href))
        .map((event) => ({
          key: event.id,
          href: event.href,
          label: t(event.labelKey),
          title: event.title,
          date: event.date,
          overdue: event.date < day,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [assigned, day, events, t],
  );

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.date > day)
        .filter((event) => !assigned.some((row) => row.href === event.href))
        .map((event) => ({
          key: event.id,
          href: event.href,
          label: t(event.labelKey),
          title: event.title,
          date: event.date,
          overdue: false,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 12),
    [assigned, day, events, t],
  );

  const nowRows = [...assigned, ...due].filter((row) => !row.date || row.date <= day);
  const nextRows = [...assigned, ...upcoming].filter(
    (row) => {
      const days = daysUntil(row.date);
      return days !== null && days > 0 && days <= 7;
    },
  );
  const laterRows = [...assigned, ...upcoming].filter(
    (row) => row.date > day && !nextRows.some((next) => next.key === row.key),
  );
  const empty = nowRows.length === 0 && nextRows.length === 0 && laterRows.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("today.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("today.hint")}</p>
      </header>

      {empty ? (
        <EmptyState icon={moduleByKey("today").icon} titleKey="today.empty" />
      ) : (
        <>
          <Section testId="today-now" title={t("today.now")} rows={nowRows} language={settings.language} />
          <Section testId="today-next" title={t("today.next")} rows={nextRows} language={settings.language} />
          <Section testId="today-later" title={t("today.later")} rows={laterRows} language={settings.language} />
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
            <Link
              href={row.href}
              aria-label={`${row.title} · ${row.label}`}
              className="flex min-h-16 flex-wrap items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3 text-base hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{row.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {row.label}
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
          </li>
        ))}
      </ul>
    </section>
  );
}
