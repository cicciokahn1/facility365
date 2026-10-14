'use client';

/**
 * Jahresplan eines Gebaeudes.
 *
 * Sammelt alle wiederkehrenden Pflichten (Wartungen, Kontrollen, Pruefungen)
 * des Jahres nach Monat. Auf Knopfdruck fehlende Wartungen aus den Anlagen
 * erstellen - ohne doppelte Erfassung.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';
import { INTERVAL_MONTHS } from '@/lib/legionella/evaluate';
import { Building, MaintenanceInterval } from '@/lib/types';

interface PlanItem {
  date: string;
  title: string;
  kind: string;
  href: string;
}

const addMonths = (date: string, months: number): string => {
  const value = new Date(`${date}T00:00:00`);
  value.setMonth(value.getMonth() + months);
  return value.toISOString().slice(0, 10);
};

/** Erstes Faelligkeitsdatum ab heute, von einem Stichtag aus weitergerollt. */
const nextFrom = (base: string, interval: MaintenanceInterval): string => {
  const months = INTERVAL_MONTHS[interval] ?? 12;
  const now = today();
  let next = addMonths(base || now, months);
  let guard = 0;
  while (next < now && guard < 240) {
    next = addMonths(next, months);
    guard += 1;
  }
  return next;
};

export function YearPlan({ building }: { building: Building }) {
  const t = useT();
  const { settings } = useSettings();
  const maintenances = useCollection('maintenances');
  const inspections = useCollection('inspections');
  const firechecks = useCollection('firechecks');
  const playgroundchecks = useCollection('playgroundchecks');
  const legionella = useCollection('legionella');
  const rcd = useCollection('rcd');
  const assets = useCollection('assets');
  const year = new Date().getFullYear();
  const [created, setCreated] = useState(false);

  const items = useMemo(() => {
    const due = { list: [] as PlanItem[] };
    const add = (
      entry: { id: string; title?: string; buildingId?: string; nextDate?: string },
      kind: string,
      href: string,
    ) => {
      if (entry.buildingId !== building.id || !entry.nextDate) return;
      const date = entry.nextDate.slice(0, 10);
      if (!date.startsWith(String(year))) return;
      due.list.push({
        date,
        title: entry.title || '',
        kind,
        href,
      });
    };
    maintenances.items.forEach((entry) =>
      add(entry, t('module.maintenances'), `/maintenances/${entry.id}`),
    );
    inspections.items.forEach((entry) =>
      add(entry, t('module.inspections'), `/inspections/${entry.id}`),
    );
    firechecks.items.forEach((entry) =>
      add(entry, t('module.firechecks'), `/firesafety/${entry.id}`),
    );
    playgroundchecks.items.forEach((entry) =>
      add(entry, t('module.playgroundchecks'), `/playgrounds/${entry.id}`),
    );
    legionella.items.forEach((entry) =>
      add(
        { ...entry, title: entry.measuringPoint },
        t('module.legionella'),
        `/legionella/${entry.id}`,
      ),
    );
    rcd.items.forEach((entry) => add(entry, t('module.rcd'), `/rcd/${entry.id}`));
    due.list.sort((a, b) => a.date.localeCompare(b.date));
    return due.list;
  }, [
    building.id,
    year,
    maintenances.items,
    inspections.items,
    firechecks.items,
    playgroundchecks.items,
    legionella.items,
    rcd.items,
    t,
  ]);

  const months = useMemo(() => {
    const grouped = new Map<string, PlanItem[]>();
    items.forEach((item) => {
      const key = item.date.slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  /** Anlagen mit Intervall, zu denen noch keine Wartung existiert. */
  const missing = useMemo(
    () =>
      assets.items.filter(
        (asset) =>
          asset.buildingId === building.id &&
          asset.maintenanceInterval &&
          !maintenances.items.some((entry) => entry.assetId === asset.id),
      ),
    [assets.items, maintenances.items, building.id],
  );

  const createMissing = () => {
    missing.forEach((asset) => {
      const interval = asset.maintenanceInterval as MaintenanceInterval;
      maintenances.create({
        title: `${asset.name} – ${t('module.maintenances')}`,
        description: '',
        status: 'planned',
        interval,
        propertyId: asset.propertyId || building.propertyId,
        buildingId: building.id,
        assetId: asset.id,
        company: '',
        supplierId: asset.supplierId,
        responsible: asset.responsible ?? '',
        assigneeUserId: '',
        assigneeTeam: '',
        lastDate: asset.installedAt || '',
        nextDate: nextFrom(asset.installedAt || today(), interval),
        checklist: [],
      });
    });
    setCreated(true);
    toast.success(
      t('yearPlan.created').replace('{n}', String(missing.length)),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('yearPlan.hint').replace('{year}', String(year))}
        </p>
        {missing.length > 0 && !created ? (
          <Button size="sm" variant="outline" onClick={createMissing} data-testid="year-plan-create">
            <CalendarPlus className="size-4" aria-hidden />
            {t('yearPlan.createMissing').replace('{n}', String(missing.length))}
          </Button>
        ) : null}
        {created ? (
          <span className="flex items-center gap-1 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" aria-hidden />
            {t('yearPlan.createdDone')}
          </span>
        ) : null}
      </div>
      {months.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          {t('yearPlan.empty')}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {months.map(([month, entries]) => (
            <li key={month} className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm font-semibold">
                {new Date(`${month}-01T00:00:00`).toLocaleDateString(settings.language, {
                  month: 'long',
                  year: 'numeric',
                })}
                <span className="ml-2 text-muted-foreground">({entries.length})</span>
              </p>
              <ul className="flex flex-col divide-y">
                {entries.map((item) => (
                  <li key={`${item.href}-${item.date}`}>
                    <Link
                      href={item.href}
                      className="flex flex-wrap items-baseline gap-x-3 py-2 text-sm hover:underline"
                    >
                      <span className="w-24 shrink-0 text-muted-foreground">
                        {formatDate(item.date, settings.language)}
                      </span>
                      <span className="font-medium">{item.title || '–'}</span>
                      <span className="text-xs text-muted-foreground">{item.kind}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
