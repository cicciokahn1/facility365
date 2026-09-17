'use client';

/** Reinigungsrapport zusammenstellen, herunterladen und drucken. */
import { useCallback } from 'react';

import { logoOf } from '@/lib/branding/logo';
import type {
  CleaningPdfBranding,
  CleaningPdfData,
  CleaningPdfLabels,
} from '@/lib/cleaning/cleaning-pdf';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { formatWorkTime, hasWorkTime } from '@/lib/reports/work-time';
import {
  CLEANING_CHECK_RESULT_OPTIONS,
  CLEANING_INTERVAL_OPTIONS,
  CLEANING_TASK_STATUS_OPTIONS,
  SelectOption,
} from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { Cleaner, CleaningTask } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import {
  checklistFor,
  equipmentFor,
  guidanceFor,
  safetyNotesFor,
} from '@/lib/cleaning/checklists';
import type { Language } from '@/lib/i18n/dictionary';

export interface CleaningPdfApi {
  data: (task: CleaningTask) => CleaningPdfData;
  download: (task: CleaningTask, format?: 'a4' | 'a3') => Promise<void>;
  print: (task: CleaningTask, format?: 'a4' | 'a3') => Promise<void>;
}

/** Die PDF-Erzeugung wird erst beim Klick geladen, nicht beim Oeffnen der Seite. */
const pdfModule = () => import('@/lib/cleaning/cleaning-pdf');

const nameOf = (cleaner?: Cleaner): string =>
  cleaner ? [cleaner.firstName, cleaner.name].filter(Boolean).join(' ') : '';

export function useCleaningPdf(): CleaningPdfApi {
  const t = useT();
  const { settings } = useSettings();
  const areas = useCollectionItems('cleaningareas');
  const cleaners = useCollectionItems('cleaners');
  const plans = useCollectionItems('cleaningplans');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const checks = useCollectionItems('cleaningchecks');

  const labelOf = useCallback(
    (options: SelectOption[], value: string): string => {
      const option = options.find((entry) => entry.value === value);
      return option ? t(option.labelKey) : value;
    },
    [t],
  );

  const data = useCallback(
    (task: CleaningTask): CleaningPdfData => {
      const area = areas.find((entry) => entry.id === task.areaId);
      const plan = plans.find((entry) => entry.id === task.planId);
      const property = properties.find(
        (entry) => entry.id === (task.propertyId || area?.propertyId),
      );
      const building = buildings.find(
        (entry) => entry.id === (task.buildingId || area?.buildingId),
      );
      const room = rooms.find((entry) => entry.id === (task.roomId || area?.roomId));
      const time = { start: task.workStart, end: task.workEnd, breakMinutes: task.breakMinutes };
      const language = settings.language as Language;
      const effectiveChecklist = checklistFor(task.checklist, area?.type ?? '');

      return {
        number: task.number,
        title: task.title,
        date: formatDate(task.date, settings.language),
        status: labelOf(CLEANING_TASK_STATUS_OPTIONS, task.status),
        areaName: area?.name ?? '',
        location: area?.location ?? '',
        propertyName: property?.name ?? '',
        buildingName: building?.name ?? '',
        roomName: room?.name ?? '',
        areaType: area?.type ?? '',
        cleanerName: nameOf(cleaners.find((entry) => entry.id === task.cleanerId)),
        responsibleName: nameOf(
          cleaners.find((entry) => entry.id === (task.responsibleId || area?.responsibleId)),
        ),
        interval: plan ? labelOf(CLEANING_INTERVAL_OPTIONS, plan.interval) : '',
        workStart: task.workStart,
        workEnd: task.workEnd,
        breakMinutes: task.breakMinutes,
        workTotal: hasWorkTime(time) ? `${formatWorkTime(time)} h` : '–',
        checklist: effectiveChecklist.map((item) => ({
          text: item.text,
          done: item.done,
          ...guidanceFor(item.text, language),
        })),
        materials: task.materials.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        })),
        equipment: equipmentFor(area?.type ?? '', language),
        safetyNotes: safetyNotesFor(area?.type ?? '', language),
        remarks: task.notes,
        checks: checks
          .filter((check) => check.taskId === task.id)
          .map((check) => ({
            date: formatDate(check.date, settings.language),
            inspector:
              nameOf(cleaners.find((entry) => entry.id === check.inspectorId)) || check.inspector,
            result: labelOf(CLEANING_CHECK_RESULT_OPTIONS, check.result),
            measures: check.measures,
          })),
        photos: task.photos.map((photo) => ({ url: photo.url, caption: photo.caption ?? photo.name })),
      };
    },
    [areas, buildings, checks, cleaners, labelOf, plans, properties, rooms, settings.language],
  );

  const labels = useCallback(
    (): CleaningPdfLabels => ({
      report: t('cleaning.report'),
      date: t('common.date'),
      status: t('common.status'),
      area: t('module.cleaningareas.singular'),
      place: t('cleaning.place'),
      cleaner: t('cleaning.assignee'),
      responsible: t('cleaning.responsible'),
      interval: t('cleaning.intervalLabel'),
      workTime: t('work.total'),
      start: t('work.start'),
      end: t('work.end'),
      breakLabel: t('work.break'),
      total: t('common.total'),
      checklist: t('tab.checklist'),
      material: t('tab.material'),
      quantity: t('common.quantity'),
      remarks: t('cleaning.remarks'),
      checks: t('module.cleaningchecks'),
      inspector: t('cleaning.inspector'),
      result: t('cleaning.result'),
      measures: t('cleaning.measures'),
      photos: t('tab.photos'),
      none: t('common.none'),
      ok: t('cleaning.result.ok'),
      rework: t('cleaning.result.rework'),
      notDone: t('cleaning.result.notDone'),
      safety: t('cleaning.safety'),
      equipment: t('cleaning.equipment'),
    }),
    [t],
  );

  const branding = useCallback((): CleaningPdfBranding => {
    const address = settings.companyAddress;
    return {
      companyName: settings.companyName || 'Facility365',
      companyAddress: [address.street, [address.zip, address.city].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', '),
      companyContact: [settings.companyPhone, settings.companyEmail].filter(Boolean).join(' · '),
      logo: logoOf(settings.companyLogo),
    };
  }, [settings]);

  return {
    data,
    download: async (task, format = 'a4') => {
      const { downloadCleaningPdf } = await pdfModule();
      downloadCleaningPdf(data(task), labels(), branding(), format);
    },
    print: async (task, format = 'a4') => {
      const { printCleaningPdf } = await pdfModule();
      printCleaningPdf(data(task), labels(), branding(), format);
    },
  };
}
