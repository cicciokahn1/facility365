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
          labelKey: 'keys.movements',
          content: <KeyMovements entity={entity} onChange={update} />,
        },
      ]}
    />
  );
}
