'use client';

/** Stundenansätze je Rolle; genutzt für Benutzer- und Reinigungsrollen. */
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { CLEANER_ROLE_OPTIONS, USER_ROLE_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { CleanerRole, UserRole } from '@/lib/types';

type RateMap = Partial<Record<string, number>>;

function RoleRateCard({
  options,
  rates,
  onSave,
}: {
  options: { value: string; labelKey: TranslationKey }[];
  rates: RateMap;
  onSave: (rates: RateMap) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState<RateMap>(rates);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{t('settings.hourlyRates')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t('settings.hourlyRatesHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <div key={option.value} className="flex flex-col gap-1.5">
              <Label htmlFor={`role-rate-${option.value}`}>{t(option.labelKey)}</Label>
              <Input
                id={`role-rate-${option.value}`}
                type="number"
                min="0"
                step="0.05"
                value={draft[option.value] ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [option.value]:
                      event.target.value === '' ? undefined : Number(event.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <Button className="self-start" onClick={() => onSave(draft)}>
          {t('action.save')}
        </Button>
      </CardContent>
    </Card>
  );
}

export function UserRateSettings() {
  const { settings, save } = useSettings();
  return (
    <RoleRateCard
      options={USER_ROLE_OPTIONS}
      rates={settings.roleHourlyRates ?? {}}
      onSave={(rates) =>
        save({ ...settings, roleHourlyRates: rates as Partial<Record<UserRole, number>> })
      }
    />
  );
}

export function CleanerRateSettings() {
  const { settings, save } = useSettings();
  return (
    <RoleRateCard
      options={CLEANER_ROLE_OPTIONS}
      rates={settings.cleanerRoleHourlyRates ?? {}}
      onSave={(rates) =>
        save({
          ...settings,
          cleanerRoleHourlyRates: rates as Partial<Record<CleanerRole, number>>,
        })
      }
    />
  );
}
