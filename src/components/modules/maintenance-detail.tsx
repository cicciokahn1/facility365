'use client';

import { ChecklistEditor } from '@/components/module/checklist-editor';
import { EntityDetail } from '@/components/module/entity-detail';

export function MaintenanceDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="maintenances"
      id={id}
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
