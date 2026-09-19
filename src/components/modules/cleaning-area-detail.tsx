'use client';

/**
 * Reinigungsbereich.
 *
 * Die Checkliste dient als Vorlage jeder Aufgabe des Bereichs; die Reiter
 * zeigen Plaene, Aufgaben, Kontrollen und Reklamationen als Verlauf des Ortes.
 */
import { ChecklistEditor } from '@/components/module/checklist-editor';
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { CleaningInstructionPanel } from '@/components/modules/cleaning-instruction-panel';
import { checklistFor } from '@/lib/cleaning/checklists';

export function CleaningAreaDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="cleaningareas"
      id={id}
      extraTabs={(area, update) => [
        {
          value: 'checklist',
          labelKey: 'cleaning.checklistTemplate',
          content: (
            <div className="flex flex-col gap-4">
              <ChecklistEditor
                items={checklistFor(area.checklist, area.type)}
                onChange={(checklist) => update({ checklist })}
              />
              <CleaningInstructionPanel
                source={{ type: area.type, area, checklist: area.checklist }}
              />
            </div>
          ),
        },
        {
          value: 'plans',
          labelKey: 'module.cleaningplans',
          content: <RelatedList collection="cleaningplans" field="areaId" value={area.id} />,
        },
        {
          value: 'tasks',
          labelKey: 'module.cleaningtasks',
          content: <RelatedList collection="cleaningtasks" field="areaId" value={area.id} />,
        },
        {
          value: 'checks',
          labelKey: 'module.cleaningchecks',
          content: <RelatedList collection="cleaningchecks" field="areaId" value={area.id} />,
        },
        {
          value: 'complaints',
          labelKey: 'module.cleaningcomplaints',
          content: <RelatedList collection="cleaningcomplaints" field="areaId" value={area.id} />,
        },
      ]}
    />
  );
}
