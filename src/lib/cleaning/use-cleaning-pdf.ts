'use client';

/** Reinigungsrapport zusammenstellen, herunterladen und drucken. */
import { useCallback } from 'react';

import { logoOf } from '@/lib/branding/logo';
import type {
  CleaningPdfBranding,
  CleaningPdfData,
  CleaningPdfLabels,
} from '@/lib/cleaning/cleaning-pdf';
import {
  downloadCleaningPdf,
  printCleaningPdf,
} from '@/lib/cleaning/cleaning-pdf';
import type {
  CleaningInstructionData,
  CleaningInstructionLabels,
} from '@/lib/cleaning/cleaning-instruction-pdf';
import { downloadCleaningInstructionPdf } from '@/lib/cleaning/cleaning-instruction-pdf';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { formatWorkTime, hasWorkTime } from '@/lib/reports/work-time';
import {
  CLEANING_CHECK_RESULT_OPTIONS,
  CLEANING_AREA_TYPE_OPTIONS,
  CLEANING_INTERVAL_OPTIONS,
  CLEANING_TASK_STATUS_OPTIONS,
  SelectOption,
} from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { Cleaner, CleaningTask } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';
import {
  PHASE_ORDER,
  checklistFor,
  checklistTemplateFor,
  equipmentFor,
  guidanceFor,
  phaseLabel,
  phaseOf,
  ppeFor,
  safetyNotesFor,
} from '@/lib/cleaning/checklists';
import type { Language } from '@/lib/i18n/dictionary';
import type { ChecklistItem, CleaningArea, CleaningPlan } from '@/lib/types';

/** Quelle einer Arbeitsanleitung: Reinigungsart plus vorhandene Objekt-/Plan-/Aufgabendaten. */
export interface CleaningInstructionSource {
  type: string;
  area?: CleaningArea;
  plan?: CleaningPlan;
  task?: CleaningTask;
  /** Eigene Checkliste (Bereich/Plan/Aufgabe); sonst Vorlage der Reinigungsart. */
  checklist?: ChecklistItem[];
}

export interface CleaningPdfApi {
  data: (task: CleaningTask) => CleaningPdfData;
  download: (task: CleaningTask, format?: 'a4' | 'a3') => Promise<void>;
  print: (task: CleaningTask, format?: 'a4' | 'a3') => Promise<void>;
  instruction: (source: CleaningInstructionSource, format?: 'a4' | 'a3') => void;
}

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
      const time = {
        start: task.workStart ?? '',
        end: task.workEnd ?? '',
        breakMinutes: task.breakMinutes ?? 0,
      };
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
        areaType: area ? labelOf(CLEANING_AREA_TYPE_OPTIONS, area.type) : '',
        cleanerName: nameOf(cleaners.find((entry) => entry.id === task.cleanerId)),
        responsibleName: nameOf(
          cleaners.find((entry) => entry.id === (task.responsibleId || area?.responsibleId)),
        ),
        interval: plan ? labelOf(CLEANING_INTERVAL_OPTIONS, plan.interval) : '',
        workStart: task.workStart ?? '',
        workEnd: task.workEnd ?? '',
        breakMinutes: task.breakMinutes ?? 0,
        workTotal: hasWorkTime(time) ? `${formatWorkTime(time)} h` : '–',
        checklist: effectiveChecklist.map((item) => ({
          text: item.text ?? '',
          done: item.done,
          ...guidanceFor(item.text, language),
        })),
        materials: (task.materials ?? []).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit ?? '',
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
        photos: (task.photos ?? []).map((photo) => ({
          url: photo.url,
          caption: photo.caption ?? photo.name,
        })),
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
      control: t('cleaning.control'),
      fullyCleaned: t('cleaning.control.fullyCleaned'),
      suppliesRefilled: t('cleaning.control.suppliesRefilled'),
      noVisibleSoiling: t('cleaning.control.noVisibleSoiling'),
      leftTidy: t('cleaning.control.leftTidy'),
      cleanerSignature: t('cleaning.signature.cleaner'),
      signatureDate: t('cleaning.signature.date'),
      checkedBySignature: t('cleaning.signature.checkedBy'),
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

  const instructionData = useCallback(
    (source: CleaningInstructionSource): CleaningInstructionData => {
      const language = settings.language as Language;
      const { type, area, plan, task } = source;
      const property = properties.find(
        (entry) => entry.id === (task?.propertyId || area?.propertyId),
      );
      const building = buildings.find(
        (entry) => entry.id === (task?.buildingId || area?.buildingId),
      );
      const room = rooms.find((entry) => entry.id === (task?.roomId || area?.roomId));
      const cleaner = cleaners.find(
        (entry) => entry.id === (task?.cleanerId || plan?.cleanerId),
      );
      const checklist =
        source.checklist && source.checklist.length > 0
          ? source.checklist
          : checklistTemplateFor(type);
      const versionSource = task?.updatedAt || plan?.updatedAt || area?.updatedAt || '';
      const phases = Object.fromEntries(
        PHASE_ORDER.map((phase) => [phase, phaseLabel(phase, language)]),
      ) as CleaningInstructionData['phases'];
      return {
        title: labelOf(CLEANING_AREA_TYPE_OPTIONS, type),
        areaType: labelOf(CLEANING_AREA_TYPE_OPTIONS, type),
        propertyName: property?.name ?? '',
        buildingName: building?.name ?? '',
        location: area?.location ?? '',
        roomName: room?.name ?? '',
        areaName: area?.name ?? '',
        cleanerName: nameOf(cleaner),
        interval: plan ? labelOf(CLEANING_INTERVAL_OPTIONS, plan.interval) : '',
        date: formatDate(new Date().toISOString().slice(0, 10), settings.language),
        version: versionSource
          ? formatDate(versionSource.slice(0, 10), settings.language)
          : '1.0',
        ppe: ppeFor(type, language),
        safetyNotes: safetyNotesFor(type, language),
        equipment: equipmentFor(type, language),
        materials: (task?.materials ?? [])
          .map((item) => `${item.name ?? ''} ${item.quantity ?? ''} ${item.unit ?? ''}`.trim())
          .filter(Boolean),
        steps: checklist.map((item) => ({
          phase: phaseOf(item.text),
          text: item.text ?? '',
          ...guidanceFor(item.text, language),
        })),
        phases,
      };
    },
    [buildings, cleaners, labelOf, properties, rooms, settings.language],
  );

  const instructionLabels = useCallback(
    (): CleaningInstructionLabels => ({
      workInstruction: t('cleaning.workInstruction'),
      areaType: t('cleaning.areaType'),
      place: t('cleaning.place'),
      room: t('module.rooms.singular'),
      area: t('module.cleaningareas.singular'),
      cleaner: t('cleaning.assignee'),
      interval: t('cleaning.intervalLabel'),
      date: t('common.date'),
      version: t('cleaning.version'),
      ppe: t('cleaning.ppe'),
      equipment: t('cleaning.equipment'),
      material: t('tab.material'),
      control: t('cleaning.control'),
      ok: t('cleaning.result.ok'),
      rework: t('cleaning.result.rework'),
      notDone: t('cleaning.result.notDone'),
      reworkHint: t('cleaning.reworkHint'),
      cleanerSignature: t('cleaning.signature.cleaner'),
      signatureDate: t('cleaning.signature.date'),
      checkedBySignature: t('cleaning.signature.checkedBy'),
    }),
    [t],
  );

  return {
    data,
    instruction: (source, format = 'a4') => {
      downloadCleaningInstructionPdf(instructionData(source), instructionLabels(), branding(), format);
    },
    download: async (task, format = 'a4') => {
      downloadCleaningPdf(data(task), labels(), branding(), format);
    },
    print: async (task, format = 'a4') => {
      printCleaningPdf(data(task), labels(), branding(), format);
    },
  };
}
