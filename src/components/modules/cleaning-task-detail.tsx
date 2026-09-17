'use client';

/**
 * Reinigungsaufgabe.
 *
 * Kopf mit „Erledigt“, dazu Checkliste, Reinigungsmittel, Arbeitszeit,
 * Kontrollen, Reklamationen und der Rapport als PDF.
 */
import { toast } from 'sonner';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { EntityDetail } from '@/components/module/entity-detail';
import { MaterialEditor } from '@/components/module/material-editor';
import { RelatedList } from '@/components/module/related-list';
import { CleaningPdfPanel } from '@/components/modules/cleaning-pdf-panel';
import { WorkTimePanel } from '@/components/modules/work-time-panel';
import { checklistFor } from '@/lib/cleaning/checklists';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { hourlyRateFor } from '@/lib/reports/hourly-rate';
import { useSettings } from '@/lib/settings/provider';

export function CleaningTaskDetail({ id }: { id: string }) {
  const t = useT();
  const cleaners = useCollectionItems('cleaners');
  const areas = useCollectionItems('cleaningareas');
  const users = useCollectionItems('users');
  const suppliers = useCollectionItems('suppliers');
  const { settings } = useSettings();

  return (
    <EntityDetail
      collection="cleaningtasks"
      id={id}
      extraTabs={(task, update) => [
        {
          value: 'checklist',
          labelKey: 'tab.checklist',
          content: (
            <ChecklistEditor
              items={checklistFor(
                task.checklist,
                areas.find((area) => area.id === task.areaId)?.type ?? '',
              )}
              onChange={(checklist) => update({ checklist })}
            />
          ),
        },
        {
          value: 'materials',
          labelKey: 'cleaning.supplies',
          content: (
            <MaterialEditor
              items={task.materials}
              onChange={(materials) => update({ materials })}
            />
          ),
        },
        {
          value: 'workTime',
          labelKey: 'tab.workTime',
          content: (
            <WorkTimePanel
              values={{
                workDate: task.date,
                workStart: task.workStart,
                workEnd: task.workEnd,
                breakMinutes: task.breakMinutes,
              }}
              onChange={(values) => {
                const cleaner = cleaners.find((entry) => entry.id === task.cleanerId);
                update({
                  date: values.workDate,
                  workStart: values.workStart,
                  workEnd: values.workEnd,
                  breakMinutes: values.breakMinutes,
                  hourlyRate: hourlyRateFor({
                    explicit: task.hourlyRate,
                    user: users.find((entry) => entry.id === task.assigneeUserId),
                    cleaner,
                    supplier: suppliers.find((entry) => entry.id === cleaner?.supplierId),
                    settings,
                  }),
                });
                toast.success(t('toast.saved'));
              }}
            />
          ),
        },
        {
          value: 'checks',
          labelKey: 'module.cleaningchecks',
          content: <RelatedList collection="cleaningchecks" field="taskId" value={task.id} />,
        },
        {
          value: 'complaints',
          labelKey: 'module.cleaningcomplaints',
          content: <RelatedList collection="cleaningcomplaints" field="taskId" value={task.id} />,
        },
        {
          value: 'report',
          labelKey: 'cleaning.report',
          content: <CleaningPdfPanel task={task} />,
        },
      ]}
    />
  );
}
