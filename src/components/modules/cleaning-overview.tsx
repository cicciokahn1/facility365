'use client';

/**
 * Uebersicht der Reinigung.
 *
 * Zeigt, was heute ansteht, was ueberfaellig ist und wo Reklamationen offen
 * sind. Eigene Daten fuehrt die Uebersicht nicht.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { Brush, CalendarClock, ClipboardCheck, MessageSquareWarning, Printer } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { useOwnTaskRestriction } from '@/components/modules/cleaning-task-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { CLEANING_TASK_STATUS_OPTIONS } from '@/lib/schema';
import { Building, CleaningPlan, CleaningTask } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import { useSettings } from '@/lib/settings/provider';
import { isDone } from '@/lib/workflow/complete';
import { today } from '@/lib/utils/format';
import { cleaningDates } from '@/lib/cleaning/schedule';
import { logoOf } from '@/lib/branding/logo';
import type { CleaningScheduleRow } from '@/lib/cleaning/cleaning-schedule-pdf';
import { checklistFor } from '@/lib/cleaning/checklists';

interface Tile {
  labelKey: TranslationKey;
  value: number;
  href: string;
  icon: typeof Brush;
}

export function CleaningOverview() {
  const t = useT();
  const { settings } = useSettings();
  const tasks = useCollectionItems('cleaningtasks');
  const areas = useCollectionItems('cleaningareas');
  const plans = useCollectionItems('cleaningplans');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const complaints = useCollectionItems('cleaningcomplaints');
  const checks = useCollectionItems('cleaningchecks');
  const cleaners = useCollectionItems('cleaners');
  const only = useOwnTaskRestriction();

  const visibleTasks = useMemo(
    () => (only ? tasks.filter((task) => task.cleanerId === only.value) : tasks),
    [only, tasks],
  );

  const openTasks = useMemo(
    () => visibleTasks.filter((task) => !isDone('cleaningtasks', task.status)),
    [visibleTasks],
  );

  const due = useMemo(() => {
    const day = today();
    return openTasks
      .filter((task) => task.date && task.date <= day)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
  }, [openTasks]);

  const openComplaints = useMemo(
    () => complaints.filter((entry) => entry.status === 'open' || entry.status === 'inProgress'),
    [complaints],
  );

  const planning = useMemo(() => {
    const occurrences = (plan: CleaningPlan): number => {
      if (plan.interval === 'daily') return 5;
      if (plan.interval === 'weekly') return 1;
      if (plan.interval === 'biweekly') return 0.5;
      if (plan.interval === 'monthly') return 0.25;
      if (plan.interval === 'quarterly') return 1 / 12;
      return plan.intervalDays ? 7 / plan.intervalDays : 0;
    };
    const areaById = new Map(areas.map((area) => [area.id, area]));
    const buildingById = new Map(buildings.map((building) => [building.id, building]));
    const weeklyHours = plans
      .filter((plan) => plan.status === 'active')
      .reduce((total, plan) => {
        const area = areaById.get(plan.areaId);
        const minutes = plan.durationMinutes ?? (
          (area?.area ?? 0) * (area?.minutesPer100m2 ?? 0) / 100
        );
        return total + occurrences(plan) * minutes / 60;
      }, 0);
    const rooms = new Map<string, { building: Building | undefined; area: number; count: number; coverings: string[] }>();
    areas.forEach((area) => {
      const current = rooms.get(area.buildingId) ?? {
        building: buildingById.get(area.buildingId),
        area: 0,
        count: 0,
        coverings: [],
      };
      current.area += area.area ?? 0;
      current.count += 1;
      if (area.floorCovering) current.coverings.push(area.floorCovering);
      rooms.set(area.buildingId, current);
    });
    const tours = new Map<string, CleaningPlan[]>();
    plans.forEach((plan) => {
      const key = plan.tour?.trim() || t('cleaning.noTour');
      tours.set(key, [...(tours.get(key) ?? []), plan]);
    });
    tours.forEach((entries) => entries.sort((a, b) => (a.tourOrder ?? 0) - (b.tourOrder ?? 0)));
    return {
      weeklyHours,
      rooms: [...rooms.values()],
      tours: [...tours.entries()],
    };
  }, [areas, buildings, plans, t]);

  const scheduleRows = useMemo<CleaningScheduleRow[]>(() => {
    const day = today();
    const end = new Date(`${day}T00:00:00`);
    end.setDate(end.getDate() + 6);
    const until = end.toISOString().slice(0, 10);
    const areaById = new Map(areas.map((area) => [area.id, area]));
    const buildingById = new Map(buildings.map((building) => [building.id, building]));
    const roomById = new Map(rooms.map((room) => [room.id, room]));
    const cleanerById = new Map(cleaners.map((cleaner) => [cleaner.id, cleaner]));
    const rows: CleaningScheduleRow[] = [];
    const keys = new Set<string>();
    const nameOf = (cleanerId: string): string => {
      const cleaner = cleanerById.get(cleanerId);
      return cleaner ? [cleaner.firstName, cleaner.name].filter(Boolean).join(' ') : '';
    };
    const addTask = (task: CleaningTask): void => {
      if (!task.date || task.date < day || task.date > until || isDone('cleaningtasks', task.status)) return;
      const area = areaById.get(task.areaId);
      const key = `${task.planId || task.id}-${task.date}`;
      if (keys.has(key)) return;
      keys.add(key);
      rows.push({
        sortKey: `${task.date}${task.workStart}`,
        date: formatDate(task.date, settings.language),
        time: task.workStart,
        title: task.title || task.number,
        building: buildingById.get(task.buildingId || area?.buildingId || '')?.name ?? '',
        room: roomById.get(task.roomId || area?.roomId || '')?.name ?? '',
        area: area?.name ?? '',
        cleaner: nameOf(task.cleanerId),
        checklist: checklistFor(task.checklist, area?.type ?? '').map((item) => item.text),
      });
    };
    visibleTasks.forEach(addTask);
    plans.filter((plan) => plan.status === 'active').forEach((plan) => {
      const area = areaById.get(plan.areaId);
      cleaningDates(plan.nextDate, plan, until).forEach((date) => {
        const key = `${plan.id}-${date}`;
        if (keys.has(key)) return;
        keys.add(key);
        rows.push({
          sortKey: `${date}${plan.timeStart}`,
          date: formatDate(date, settings.language),
          time: plan.timeStart,
          title: plan.title || area?.name || plan.number,
          building: buildingById.get(area?.buildingId ?? '')?.name ?? '',
          room: roomById.get(area?.roomId ?? '')?.name ?? '',
          area: area?.name ?? '',
          cleaner: nameOf(plan.cleanerId),
          checklist: checklistFor(
            plan.checklist.length > 0 ? plan.checklist : area?.checklist ?? [],
            area?.type ?? '',
          ).map((item) => item.text),
        });
      });
    });
    return rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [areas, buildings, cleaners, plans, rooms, settings.language, visibleTasks]);

  const printSchedule = async (mode: 'weekly' | 'roomSheets'): Promise<void> => {
    const { downloadCleaningSchedulePdf } = await import('@/lib/cleaning/cleaning-schedule-pdf');
    const address = settings.companyAddress;
    downloadCleaningSchedulePdf(
      scheduleRows,
      {
        weeklyPlan: t('cleaning.weeklyPlan'),
        roomSheets: t('cleaning.roomSheets'),
        date: t('common.date'),
        time: t('cleaning.time'),
        building: t('module.buildings.singular'),
        room: t('module.rooms.singular'),
        area: t('module.cleaningareas.singular'),
        cleaner: t('cleaning.assignee'),
        instructions: t('cleaning.instructions'),
        signature: t('cleaning.signature'),
        checkedBy: t('cleaning.checkedBy'),
        checkDate: t('cleaning.checkDate'),
        problem: t('cleaning.problem'),
        none: t('cleaning.nothingDue'),
        language: settings.language,
        ok: t('cleaning.result.ok'),
        rework: t('cleaning.result.rework'),
        notDone: t('cleaning.result.notDone'),
      },
      {
        companyName: settings.companyName || 'Facility365',
        companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
        logo: logoOf(settings.companyLogo),
      },
      mode,
    );
  };

  const tiles: Tile[] = [
    { labelKey: 'cleaning.openTasks', value: openTasks.length, href: '/cleaning/tasks', icon: CalendarClock },
    { labelKey: 'module.cleaningareas', value: areas.length, href: '/cleaning/areas', icon: Brush },
    { labelKey: 'module.cleaningchecks', value: checks.length, href: '/cleaning/checks', icon: ClipboardCheck },
    {
      labelKey: 'cleaning.openComplaints',
      value: openComplaints.length,
      href: '/cleaning/complaints',
      icon: MessageSquareWarning,
    },
  ];

  const labelOf = (task: CleaningTask): string => {
    const area = areas.find((entry) => entry.id === task.areaId);
    return [area?.name, area?.location].filter(Boolean).join(' · ');
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('module.cleaning')}</h1>
            <p className="text-sm text-muted-foreground">{t('cleaning.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void printSchedule('weekly')}>
              <Printer className="size-4" aria-hidden />
              {t('cleaning.printWeekly')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void printSchedule('roomSheets')}>
              <Printer className="size-4" aria-hidden />
              {t('cleaning.printRoomSheets')}
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="cleaning-tiles">
        {tiles.map((tile) => (
          <Link key={tile.href + tile.labelKey} href={tile.href} className="block">
            <Card className="h-full transition hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <tile.icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-2xl font-semibold">{tile.value}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {t(tile.labelKey)}
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cleaning.dueToday')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {due.length === 0 ? (
            <div className="p-4">
              <EmptyState titleKey="cleaning.nothingDue" />
            </div>
          ) : (
            <ul className="divide-y" data-testid="cleaning-due">
              {due.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/cleaning/tasks/${task.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {task.title || task.number}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[formatDate(task.date, settings.language), labelOf(task)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <StatusBadge value={task.status} options={CLEANING_TASK_STATUS_OPTIONS} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cleaning.roomBook')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {planning.rooms.map((entry, index) => (
              <li key={entry.building?.id ?? index} className="flex items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{entry.building?.name || t('area.noType')}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[...new Set(entry.coverings)].join(', ') || t('cleaning.noCovering')}
                  </span>
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {entry.count} · {Math.round(entry.area * 100) / 100} m²
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cleaning.staffing')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{Math.round(planning.weeklyHours * 100) / 100} h</p>
          <p className="text-sm text-muted-foreground">{t('cleaning.weeklyHours')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cleaning.tours')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {planning.tours.map(([tour, entries]) => (
              <li key={tour} className="p-3 text-sm">
                <p className="font-medium">{tour}</p>
                <p className="text-xs text-muted-foreground">
                  {entries.map((entry) => entry.title || entry.number).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cleaning.activePlans')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {plans.length === 0 ? (
            <div className="p-4">
              <EmptyState titleKey="list.empty" />
            </div>
          ) : (
            <ul className="divide-y" data-testid="cleaning-plans">
              {plans.slice(0, 8).map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/cleaning/plans/${plan.id}`}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {plan.title || plan.number}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {areas.find((entry) => entry.id === plan.areaId)?.name ?? ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(plan.nextDate, settings.language)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
