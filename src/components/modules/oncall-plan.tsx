"use client";

/**
 * Pikettplan.
 *
 * Wochen- und Monatsansicht der geplanten Pikettperioden. Nur
 * Verwaltungsrollen (superadmin/orgadmin/sitemanager) duerfen erstellen,
 * bearbeiten und loeschen; die Datenbank-Policy erzwingt dasselbe.
 * Validierung: Ende nach Beginn, keine Ueberschneidung pro Mitarbeiter,
 * vergangene Perioden sind schreibgeschuetzt, Loeschen mit Bestaetigung.
 */
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/lib/auth/scope";
import { useCollection, useCollectionItems } from "@/lib/data/store";
import { useT } from "@/lib/i18n/provider";
import { AppUser, OncallPeriod } from "@/lib/types";

type Range = "week" | "month";

const iso = (d: Date) => d.toISOString();
const localInput = (isoValue: string) =>
  isoValue ? isoValue.slice(0, 16) : "";
const toIso = (local: string) =>
  local ? new Date(local).toISOString() : "";

const overlaps = (a: OncallPeriod, b: OncallPeriod): boolean =>
  a.assigneeUserId === b.assigneeUserId &&
  a.startAt < b.endAt &&
  b.startAt < a.endAt;

const inRange = (p: OncallPeriod, start: Date, end: Date): boolean =>
  p.startAt < iso(end) && p.endAt > iso(start);

export function OncallPlan() {
  const t = useT();
  const access = useAccess();
  const { create, update, remove } = useCollection("oncallperiods");
  const periods = useCollectionItems("oncallperiods");
  const users = useCollectionItems("users");
  const canPlan = access.canWrite("oncallperiods");

  const [range, setRange] = useState<Range>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<OncallPeriod> | null>(null);
  const [error, setError] = useState("");

  const { start, end } = useMemo(() => {
    const s = new Date(anchor);
    if (range === "week") {
      const off = (s.getDay() + 6) % 7;
      s.setDate(s.getDate() - off);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setDate(e.getDate() + 7);
      return { start: s, end: e };
    }
    s.setDate(1);
    s.setHours(0, 0, 0, 0);
    const e = new Date(s);
    e.setMonth(e.getMonth() + 1);
    return { start: s, end: e };
  }, [anchor, range]);

  const shown = useMemo(
    () =>
      periods
        .filter(
          (p) =>
            !p.deletedAt &&
            inRange(p, start, end) &&
            (assigneeFilter === "all" || p.assigneeUserId === assigneeFilter),
        )
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [periods, start, end, assigneeFilter],
  );

  const shift = (dir: number) => {
    const d = new Date(anchor);
    if (range === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };

  const nameOf = (id: string) =>
    users.find((u: AppUser) => u.id === id)?.name ?? id;

  const openNew = () => {
    setError("");
    setEditing({
      title: "",
      assigneeUserId: "",
      deputyUserId: "",
      startAt: "",
      endAt: "",
    });
  };

  const save = () => {
    if (!editing) return;
    const draft = { ...editing, startAt: toIso(localInput(editing.startAt ?? "")), endAt: toIso(localInput(editing.endAt ?? "")) };
    if (!draft.startAt || !draft.endAt || draft.endAt <= draft.startAt) {
      setError(t("oncall.plan.endBeforeStart"));
      return;
    }
    const clash = periods.find(
      (p) => !p.deletedAt && p.id !== editing.id && overlaps({ ...(draft as OncallPeriod), id: "" } as OncallPeriod, p),
    );
    if (clash) {
      setError(t("oncall.plan.overlap"));
      return;
    }
    if (editing.id) {
      update(editing.id, draft, "update");
    } else {
      create(draft as Partial<OncallPeriod>);
    }
    setEditing(null);
  };

  const isPast = (p: OncallPeriod) => p.endAt < iso(new Date());

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={range === "week" ? "default" : "outline"}
          onClick={() => setRange("week")}
        >
          {t("oncall.plan.week")}
        </Button>
        <Button
          size="sm"
          variant={range === "month" ? "default" : "outline"}
          onClick={() => setRange("month")}
        >
          {t("oncall.plan.month")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {start.toLocaleDateString()} – {end.toLocaleDateString()}
        </span>
        <Button size="sm" variant="ghost" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("oncall.plan.allAssignees")}</SelectItem>
            {users.map((u: AppUser) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canPlan && (
          <Button size="sm" className="ml-auto" onClick={openNew}>
            <Plus className="mr-1 size-4" />
            {t("oncall.plan.new")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {shown.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("oncall.plan.empty")}
          </p>
        )}
        {shown.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">
                {nameOf(p.assigneeUserId)}
                {p.title ? ` · ${p.title}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.startAt).toLocaleString()} –{" "}
                {new Date(p.endAt).toLocaleString()}
                {p.deputyUserId &&
                  ` · ${t("oncall.deputy")}: ${nameOf(p.deputyUserId)}`}
                {isPast(p) && ` · ${t("oncall.plan.pastReadonly")}`}
              </p>
            </div>
            {canPlan && !isPast(p) && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError("");
                    setEditing(p);
                  }}
                >
                  {t("action.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(t("oncall.plan.deleteConfirm")))
                      remove(p.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("module.oncallperiods.singular")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>{t("common.title")}</Label>
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("oncall.assignee")}</Label>
                <Select
                  value={editing.assigneeUserId ?? ""}
                  onValueChange={(v) =>
                    setEditing({ ...editing, assigneeUserId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: AppUser) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("oncall.deputy")}</Label>
                <Select
                  value={editing.deputyUserId ?? ""}
                  onValueChange={(v) =>
                    setEditing({ ...editing, deputyUserId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: AppUser) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("oncall.startAt")}</Label>
                <Input
                  type="datetime-local"
                  value={localInput(editing.startAt ?? "")}
                  onChange={(e) =>
                    setEditing({ ...editing, startAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("oncall.endAt")}</Label>
                <Input
                  type="datetime-local"
                  value={localInput(editing.endAt ?? "")}
                  onChange={(e) =>
                    setEditing({ ...editing, endAt: e.target.value })
                  }
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={save}>{t("action.save")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
