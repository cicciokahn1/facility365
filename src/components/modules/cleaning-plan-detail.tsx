'use client';

/**
 * Reinigungsplan.
 *
 * Der Plan beschreibt die Wiederholung; die Arbeit selbst entsteht als
 * Aufgabe. „Aufgabe erzeugen“ uebernimmt Ort, Zuweisung und Checkliste und
 * setzt den Plan auf den naechsten Termin.
 */
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { Button } from '@/components/ui/button';
import { nextCleaningDate } from '@/lib/cleaning/schedule';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useCurrentUser } from '@/lib/settings/provider';
import { CleaningPlan } from '@/lib/types';
import { newId } from '@/lib/utils/id';
import { isDone } from '@/lib/workflow/complete';

export function CleaningPlanDetail({ id }: { id: string }) {
  const t = useT();
  const router = useRouter();
  const user = useCurrentUser();
  const areas = useCollectionItems('cleaningareas');
  const tasks = useCollection('cleaningtasks');
  const plans = useCollection('cleaningplans');

  const createTask = (plan: CleaningPlan) => {
    const existing = tasks.items.find(
      (task) =>
        task.planId === plan.id &&
        task.date === plan.nextDate &&
        !isDone('cleaningtasks', task.status),
    );
    if (existing) {
      router.push(`/cleaning/tasks/${existing.id}`);
      return;
    }
    const area = areas.find((entry) => entry.id === plan.areaId);
    const checklist = (plan.checklist.length > 0 ? plan.checklist : area?.checklist ?? []).map(
      (item) => ({ id: newId('chk'), text: item.text, done: false }),
    );
    const task = tasks.create(
      {
        title: plan.title || area?.name || plan.number,
        planId: plan.id,
        areaId: plan.areaId,
        propertyId: area?.propertyId ?? '',
        buildingId: area?.buildingId ?? '',
        roomId: area?.roomId ?? '',
        cleanerId: plan.cleanerId,
        responsibleId: plan.responsibleId || (area?.responsibleId ?? ''),
        date: plan.nextDate,
        workStart: plan.timeStart,
        status: 'open',
        checklist,
      },
      user,
    );
    const next = nextCleaningDate(plan.nextDate, plan);
    if (next) plans.update(plan.id, { nextDate: next }, 'cleaning.history.taskCreated', user);
    toast.success(t('cleaning.taskCreated'));
    router.push(`/cleaning/tasks/${task.id}`);
  };

  return (
    <EntityDetail
      collection="cleaningplans"
      id={id}
      headerExtra={(plan) => (
        <Button size="sm" onClick={() => createTask(plan)} data-testid="cleaning-plan-create-task">
          <CalendarPlus className="size-4" aria-hidden />
          {t('cleaning.createTask')}
        </Button>
      )}
      extraTabs={(plan, update) => [
        {
          value: 'checklist',
          labelKey: 'tab.checklist',
          content: (
            <ChecklistEditor
              items={plan.checklist}
              onChange={(checklist) => update({ checklist })}
            />
          ),
        },
        {
          value: 'tasks',
          labelKey: 'module.cleaningtasks',
          content: <RelatedList collection="cleaningtasks" field="planId" value={plan.id} />,
        },
      ]}
    />
  );
}
