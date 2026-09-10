'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/provider';
import { USER_ROLE_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { TranslationKey } from '@/lib/i18n/dictionary';
import { UserRole } from '@/lib/types';

export function UserRateSettings() {
  const t = useT();
  const { settings, save } = useSettings();
  const [rates, setRates] = useState(settings.roleHourlyRates ?? {});

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base">{t('settings.hourlyRates')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t('settings.hourlyRatesHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {USER_ROLE_OPTIONS.map((option) => {
            const role = option.value as UserRole;
            return (
              <div key={role} className="flex flex-col gap-1.5">
                <Label htmlFor={`role-rate-${role}`}>
                  {t(`role.${role}` as TranslationKey)}
                </Label>
                <Input
                  id={`role-rate-${role}`}
                  type="number"
                  min="0"
                  step="0.05"
                  value={rates[role] ?? ''}
                  onChange={(event) =>
                    setRates((current) => ({
                      ...current,
                      [role]: event.target.value === '' ? undefined : Number(event.target.value),
                    }))
                  }
                />
              </div>
            );
          })}
        </div>
        <Button
          className="self-start"
          onClick={() => save({ ...settings, roleHourlyRates: rates })}
        >
          {t('action.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
