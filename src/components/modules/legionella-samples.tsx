'use client';

/**
 * Messstellen einer Legionellenkontrolle.
 *
 * Jede Zeile fuehrt Messstelle, Warm- und Kaltwassertemperatur sowie die
 * Legionellenzahl. Die Bewertung entsteht aus den Grenzwerten der
 * Einstellungen und laesst sich dort anpassen.
 */
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n/provider';
import { evaluateValues, limitsOf } from '@/lib/legionella/evaluate';
import { LEGIONELLA_RESULT_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { LegionellaSample } from '@/lib/types';
import { newId } from '@/lib/utils/id';

const numberOr = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function LegionellaSamples({
  samples,
  onChange,
}: {
  samples: LegionellaSample[];
  onChange: (samples: LegionellaSample[]) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const limits = limitsOf(settings);
  const [point, setPoint] = useState('');

  const add = () => {
    const value = point.trim();
    if (!value) return;
    onChange([...samples, { id: newId('sample'), point: value, note: '' }]);
    setPoint('');
  };

  const patch = (id: string, values: Partial<LegionellaSample>) =>
    onChange(samples.map((sample) => (sample.id === id ? { ...sample, ...values } : sample)));

  return (
    <section className="flex flex-col gap-3" data-testid="legionella-samples">
      <p className="text-xs text-muted-foreground">
        {t('legionella.limitsHint')}: {t('legionella.hotTemp')} ≥ {limits.hotMin} °C ·{' '}
        {t('legionella.coldTemp')} ≤ {limits.coldMax} °C · {t('legionella.cfu')} ≥ {limits.warnCfu} /{' '}
        {limits.limitCfu}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">{t('legionella.point')}</th>
              <th className="py-2 pr-3 font-medium">{t('legionella.hotTemp')}</th>
              <th className="py-2 pr-3 font-medium">{t('legionella.coldTemp')}</th>
              <th className="py-2 pr-3 font-medium">{t('legionella.cfu')}</th>
              <th className="py-2 pr-3 font-medium">{t('legionella.result')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {samples.map((sample) => {
              const result = evaluateValues(sample, limits);
              const option = LEGIONELLA_RESULT_OPTIONS.find((item) => item.value === result);
              return (
                <tr key={sample.id} className="border-b last:border-0" data-testid="legionella-sample">
                  <td className="py-2 pr-3">
                    <Input
                      value={sample.point}
                      onChange={(event) => patch(sample.id, { point: event.target.value })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="w-24"
                      value={sample.hotTemp ?? ''}
                      onChange={(event) => patch(sample.id, { hotTemp: numberOr(event.target.value) })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="w-24"
                      value={sample.coldTemp ?? ''}
                      onChange={(event) => patch(sample.id, { coldTemp: numberOr(event.target.value) })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="w-28"
                      value={sample.cfu ?? ''}
                      onChange={(event) => patch(sample.id, { cfu: numberOr(event.target.value) })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    {option ? (
                      <StatusBadge value={result} options={LEGIONELLA_RESULT_OPTIONS} />
                    ) : null}
                  </td>
                  <td className="py-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('action.delete')}
                      onClick={() => onChange(samples.filter((entry) => entry.id !== sample.id))}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={point}
          onChange={(event) => setPoint(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add();
          }}
          placeholder={t('legionella.point')}
          data-testid="legionella-sample-input"
        />
        <Button onClick={add} data-testid="legionella-sample-add">
          <Plus className="size-4" aria-hidden />
          {t('action.add')}
        </Button>
      </div>
    </section>
  );
}
