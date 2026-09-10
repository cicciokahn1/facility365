'use client';

/**
 * Detailansicht einer Legionellenkontrolle.
 *
 * Zusaetzlich zu den Stammdaten: Messstellen mit Bewertung und der
 * Laborbericht als PDF. Die Gesamtbewertung folgt der strengsten Messstelle.
 */
import { useEffect } from 'react';

import { EntityDetail } from '@/components/module/entity-detail';
import { LegionellaLabReport } from '@/components/modules/legionella-lab-report';
import { LegionellaSamples } from '@/components/modules/legionella-samples';

import { evaluateSamples, limitsOf } from '@/lib/legionella/evaluate';
import { useSettings } from '@/lib/settings/provider';
import { LegionellaCheck } from '@/lib/types';

export function LegionellaDetail({ id }: { id: string }) {
  const { settings } = useSettings();
  const limits = limitsOf(settings);

  return (
    <EntityDetail
      collection="legionella"
      id={id}
      headerExtra={(check, update) => (
        <LegionellaEvaluation check={check} limits={limits} onChange={update} />
      )}
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

function LegionellaEvaluation({
  check,
  limits,
  onChange,
}: {
  check: LegionellaCheck;
  limits: ReturnType<typeof limitsOf>;
  onChange: (values: Partial<LegionellaCheck>) => void;
}) {
  const result = evaluateSamples(
    check.samples?.length ? check.samples : [{ id: 'main', point: check.measuringPoint, hotTemp: check.hotTemp, coldTemp: check.coldTemp, cfu: check.cfu, note: '' }],
    limits,
  );

  useEffect(() => {
    if (result !== 'pending' && result !== check.result) onChange({ result });
  }, [check.result, onChange, result]);

  return result === 'pending' ? null : (
    <span className="rounded-full border px-2 py-1 text-xs">{result}</span>
  );
}
