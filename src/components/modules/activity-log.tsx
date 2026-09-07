"use client";

/**
 * Aktivitaets- und Aenderungshistorie.
 *
 * Die Liste ist bewusst nur lesbar: Eintraege entstehen ausschliesslich beim
 * Anlegen, Aendern, Abschliessen, Loeschen und Wiederherstellen von Daten und
 * werden nie ueberschrieben.
 */
import { useMemo, useState } from "react";
import Link from "next/link";

import { ChangeList } from "@/components/module/change-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/lib/auth/scope";
import { useCollectionItems } from "@/lib/data/store";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { table as keys } from "@/lib/i18n/generated/de";
import { useT } from "@/lib/i18n/provider";
import { moduleByCollection } from "@/lib/modules";
import { useSettings } from "@/lib/settings/provider";
import { formatDateTime } from "@/lib/utils/format";

const isKnownKey = (value: string): value is TranslationKey => value in keys;

const ALL = "all";

export function ActivityLog() {
  const t = useT();
  const { settings } = useSettings();
  const access = useAccess();
  const activities = useCollectionItems("activities");
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState(ALL);
  const [actionFilter, setActionFilter] = useState(ALL);

  /** Gezeigt wird nur, was aus Modulen mit Leserecht stammt. */
  const visible = useMemo(
    () =>
      activities.filter(
        (activity) =>
          access.visible("activities", activity) &&
          access.canRead(activity.module),
      ),
    [access, activities],
  );

  /** Auswahlwerte entstehen aus dem, was tatsaechlich protokolliert wurde. */
  const modules = useMemo(
    () =>
      Array.from(new Set(visible.map((activity) => activity.module))).sort(),
    [visible],
  );
  const actions = useMemo(
    () =>
      Array.from(new Set(visible.map((activity) => activity.action))).sort(),
    [visible],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visible
      .filter((activity) =>
        moduleFilter === ALL ? true : activity.module === moduleFilter,
      )
      .filter((activity) =>
        actionFilter === ALL ? true : activity.action === actionFilter,
      )
      .filter((activity) =>
        needle
          ? [activity.entityTitle, activity.entityNumber, activity.userName]
              .join(" ")
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 500);
  }, [actionFilter, moduleFilter, query, visible]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("activity.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("activity.hint")}</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          data-testid="activity-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("list.searchPlaceholder")}
          className="h-11"
        />
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="h-11" data-testid="activity-module">
            <SelectValue placeholder={t("activity.allModules")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("activity.allModules")}</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module} value={module}>
                {t(moduleByCollection(module).singularKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-11" data-testid="activity-action">
            <SelectValue placeholder={t("activity.allActions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("activity.allActions")}</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {isKnownKey(action) ? t(action) : action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("activity.empty")}</p>
      ) : (
        <ul data-testid="activity-list" className="flex flex-col gap-2">
          {rows.map((activity) => {
            const moduleDef = moduleByCollection(activity.module);
            return (
              <li key={activity.id}>
                <Link
                  href={`${moduleDef.path}/${activity.entityId}`}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-card p-3 text-sm hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {activity.entityTitle || activity.entityNumber}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t(moduleDef.singularKey)} · {activity.entityNumber} ·{" "}
                      {isKnownKey(activity.action)
                        ? t(activity.action)
                        : activity.action}{" "}
                      · {activity.userName || t("activity.user")}
                    </span>
                    {activity.changes && activity.changes.length > 0 ? (
                      <ChangeList changes={activity.changes} />
                    ) : null}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(activity.at, settings.language)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
