'use client';

/**
 * Arbeitszeit eines Auftrags.
 *
 * Beginn, Ende und Pause werden eingetragen, die Summe rechnet die Anwendung.
 * Bewusst ohne Zeitmessung, damit die Erfassung auch nachtraeglich stimmt.
 */
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { formatWorkTime, hasWorkTime, workedHours } from '@/lib/reports/work-time';
import { today } from '@/lib/utils/format';

export interface WorkTimeValues {
  workDate: string;
  workStart: string;
  workEnd: string;
  breakMinutes: number;
}

export function WorkTimePanel({
  values,
  onChange,
}: {
  values: WorkTimeValues;
  onChange: (values: WorkTimeValues) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<WorkTimeValues>(values);
  /** Vergleich ueber den Inhalt, da der Aufrufer bei jedem Rendern ein neues Objekt liefert. */
  const key = `${values.workDate}|${values.workStart}|${values.workEnd}|${values.breakMinutes}`;
  const [savedKey, setSavedKey] = useState(key);

  if (savedKey !== key) {
    setSavedKey(key);
    setDraft(values);
  }

  const time = {
    start: draft.workStart,
    end: draft.workEnd,
    breakMinutes: draft.breakMinutes,
  };
  const valid = hasWorkTime(time);
  const changed =
    draft.workDate !== values.workDate ||
    draft.workStart !== values.workStart ||
    draft.workEnd !== values.workEnd ||
    draft.breakMinutes !== values.breakMinutes;

  const set = (patch: Partial<WorkTimeValues>) => setDraft({ ...draft, ...patch });

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4" data-testid="work-time">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <Label htmlFor="work-date">{t('common.date')}</Label>
          <Input
            id="work-date"
            type="date"
            className="h-11"
            value={draft.workDate || today()}
            onChange={(event) => set({ workDate: event.target.value })}
            data-testid="work-date"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="work-start">{t('work.start')}</Label>
          <Input
            id="work-start"
            type="time"
            className="h-11"
            value={draft.workStart}
            onChange={(event) => set({ workStart: event.target.value })}
            data-testid="work-start"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="work-end">{t('work.end')}</Label>
          <Input
            id="work-end"
            type="time"
            className="h-11"
            value={draft.workEnd}
            onChange={(event) => set({ workEnd: event.target.value })}
            data-testid="work-end"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="work-break">{t('work.break')}</Label>
          <Input
            id="work-break"
            type="number"
            inputMode="numeric"
            min={0}
            step={5}
            className="h-11"
            value={String(draft.breakMinutes ?? 0)}
            onChange={(event) => set({ breakMinutes: Number(event.target.value) || 0 })}
            data-testid="work-break"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t('work.total')}:{' '}
          <span className="text-lg font-semibold text-foreground" data-testid="work-total">
            {valid ? `${formatWorkTime(time)} h` : '–'}
          </span>
          {valid ? (
            <span className="ml-2 text-xs" data-testid="work-decimal">
              ({workedHours(time).toFixed(2)} h)
            </span>
          ) : null}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={() =>
              onChange({ workDate: '', workStart: '', workEnd: '', breakMinutes: 0 })
            }
            data-testid="work-clear"
          >
            {t('action.delete')}
          </Button>
          <Button
            className="h-11"
            disabled={!changed}
            onClick={() => onChange({ ...draft, workDate: draft.workDate || today() })}
            data-testid="work-save"
          >
            {t('action.save')}
          </Button>
        </div>
      </div>
    </section>
  );
}
