'use client';

/**
 * Detailansicht eines Werkzeugs.
 *
 * Ausgabe und Ruecknahme laufen ueber dieselbe Bewegungsliste wie bei den
 * Schluesseln; dadurch bleibt die Bedienung fuer beide Bereiche gleich.
 */
import { EntityDetail } from '@/components/module/entity-detail';
import { KeyMovements } from '@/components/modules/key-movements';

export function ToolDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="tools"
      id={id}
      extraTabs={(entity, update) => [
        {
          value: 'movements',
          labelKey: 'tool.movements',
          content: (
            <KeyMovements
              entity={entity}
              onChange={update}
              labels={{
                issuedTo: 'tool.issuedTo',
                movements: 'tool.movements',
                movementType: 'tool.movementType',
                person: 'tool.person',
                issue: 'tool.issue',
                takeBack: 'tool.takeBack',
                movementsEmpty: 'tool.movementsEmpty',
                historyIssued: 'tool.historyIssued',
                historyReturned: 'tool.historyReturned',
              }}
            />
          ),
        },
      ]}
    />
  );
}
