'use client';

/**
 * Reinigungsaufgabe.
 *
 * Kopf mit „Erledigt“, dazu Checkliste, Reinigungsmittel, Arbeitszeit,
 * Kontrollen, Reklamationen und der Rapport als PDF.
 */
import { toast } from 'sonner';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { DoneButton } from '@/components/module/done-button';
import { EntityDetail } from '@/components/module/entity-detail';
import { MaterialEditor } from '@/components/module/material-editor';
import { RelatedList } from '@/components/module/related-list';
import { CleaningPdfPanel } from '@/components/modules/cleaning-pdf-panel';
import { WorkTimePanel } from '@/components/modules/work-time-panel';
import { useT } from '@/lib/i18n/provider';

export function CleaningTaskDetail({ id }: { id: string }) {
  const t = useT();

  return (
    <EntityDetail
      collection="cleaningtasks"
      id={id}
      headerExtra={(task) => (
        <DoneButton collection="cleaningtasks" id={task.id} status={task.status} />
      )}
      extraTabs={(task, update) => [
        {
          value: 'checklist',
          labelKey: 'tab.checklist',
          content: (
            <ChecklistEditor
              items={task.checklist}
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
                update({
                  date: values.workDate,
                  workStart: values.workStart,
                  workEnd: values.workEnd,
                  breakMinutes: values.breakMinutes,
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
