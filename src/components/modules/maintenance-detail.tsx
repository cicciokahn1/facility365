'use client';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { DoneButton } from '@/components/module/done-button';
import { EntityDetail } from '@/components/module/entity-detail';

export function MaintenanceDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="maintenances"
      id={id}
      headerExtra={(maintenance) => (
        <DoneButton collection="maintenances" id={maintenance.id} status={maintenance.status} />
      )}
      extraTabs={(maintenance, update) => [
        {
          value: 'checklist',
          labelKey: 'tab.checklist',
          content: (
            <ChecklistEditor
              items={maintenance.checklist}
              onChange={(checklist) => update({ checklist })}
            />
          ),
        },
      ]}
    />
  );
}
