'use client';

/**
 * Detailansicht einer Legionellenkontrolle.
 *
 * Zusaetzlich zu den Stammdaten: Messstellen mit Bewertung und der
 * Laborbericht als PDF. Die Gesamtbewertung folgt der strengsten Messstelle.
 */
import { EntityDetail } from '@/components/module/entity-detail';
import { LegionellaLabReport } from '@/components/modules/legionella-lab-report';
import { LegionellaSamples } from '@/components/modules/legionella-samples';
import { evaluateSamples, limitsOf } from '@/lib/legionella/evaluate';
import { useSettings } from '@/lib/settings/provider';

export function LegionellaDetail({ id }: { id: string }) {
  const { settings } = useSettings();
  const limits = limitsOf(settings);

  return (
    <EntityDetail
      collection="legionella"
      id={id}
      extraTabs={(check, update) => [
        {
          value: 'samples',
          labelKey: 'legionella.samples',
          content: (
            <LegionellaSamples
              samples={check.samples}
              onChange={(samples) => {
                const result = evaluateSamples(samples, limits);
                update({ samples, result: result === 'pending' ? check.result : result });
              }}
            />
          ),
        },
        {
          value: 'lab',
          labelKey: 'legionella.labReport',
          content: (
            <LegionellaLabReport
              report={check.labReport}
              onChange={(labReport) => update({ labReport })}
            />
          ),
        },
      ]}
    />
  );
}
