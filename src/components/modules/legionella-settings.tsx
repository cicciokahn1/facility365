'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';

export function LegionellaSettings() {
  const t = useT();
  const { settings, save } = useSettings();
  const [draft, setDraft] = useState({
    hotMin: settings.legionellaHotMin,
    coldMax: settings.legionellaColdMax,
    warnCfu: settings.legionellaWarnCfu,
    limitCfu: settings.legionellaLimitCfu,
    intervalMonths: settings.legionellaIntervalMonths,
  });

  const set = (key: keyof typeof draft, value: string) =>
    setDraft((current) => ({ ...current, [key]: Number(value) }));

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{t('settings.legionella')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Field label={`${t('legionella.hotTemp')} (min. °C)`} value={draft.hotMin} onChange={(value) => set('hotMin', value)} />
        <Field label={`${t('legionella.coldTemp')} (max. °C)`} value={draft.coldMax} onChange={(value) => set('coldMax', value)} />
        <Field label={`${t('legionella.cfu')} (${t('legionella.warning')})`} value={draft.warnCfu} onChange={(value) => set('warnCfu', value)} />
        <Field label={`${t('legionella.cfu')} (${t('legionella.critical')})`} value={draft.limitCfu} onChange={(value) => set('limitCfu', value)} />
        <Field label={t('legionella.intervalMonths')} value={draft.intervalMonths} onChange={(value) => set('intervalMonths', value)} />
        <Button
          className="self-end sm:col-span-2 sm:justify-self-start"
          onClick={() =>
            save({
              ...settings,
              legionellaHotMin: draft.hotMin,
              legionellaColdMax: draft.coldMax,
              legionellaWarnCfu: draft.warnCfu,
              legionellaLimitCfu: draft.limitCfu,
              legionellaIntervalMonths: draft.intervalMonths,
            })
          }
        >
          {t('action.save')}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type="number" min="0" step="1" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
