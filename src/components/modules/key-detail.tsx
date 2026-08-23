'use client';

/**
 * Detailansicht eines Schluessels.
 *
 * Zusaetzlich zu den Stammdaten: Ausgabe und Ruecknahme samt Bewegungsliste.
 */
import { EntityDetail } from '@/components/module/entity-detail';
import { KeyMovements } from '@/components/modules/key-movements';

export function KeyDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="keys"
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
