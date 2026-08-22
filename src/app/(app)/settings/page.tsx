'use client';

/**
 * Einstellungen.
 *
 * Es wird mit einem Entwurf gearbeitet: nichts wirkt vor dem Speichern,
 * Abbrechen stellt den gespeicherten Stand wieder her.
 */
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BRAND_LOGO_DATA_URL, BRAND_LOGO_SRC, isBrandLogo } from '@/lib/branding/logo';
import { STORAGE_BUDGET, storageUsage } from '@/lib/data/repository';
import { useClearAllData, useCollectionItems } from '@/lib/data/store';
import { LANGUAGES, useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { AppSettings, Language, ThemeMode } from '@/lib/types';
import { formatBytes } from '@/lib/utils/format';

/** Das Formular wird erst eingehaengt, wenn die gespeicherten Werte vorliegen. */
export default function SettingsPage() {
  const t = useT();
  const { settings, ready } = useSettings();
  if (!ready) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: AppSettings }) {
  const t = useT();
  const { save } = useSettings();
  const clearAll = useClearAllData();
  const cleaners = useCollectionItems('cleaners');
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [usage] = useState(() => storageUsage());
  const [resetOpen, setResetOpen] = useState(false);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('module.settings')}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.company')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={t('settings.companyName')}>
            <Input
              data-testid="company-name"
              value={draft.companyName}
              onChange={(event) => set('companyName', event.target.value)}
            />
          </Field>
          <Field label={t('settings.vatNumber')}>
            <Input value={draft.companyVat} onChange={(event) => set('companyVat', event.target.value)} />
          </Field>
          <Field label={t('common.street')}>
            <Input
              value={draft.companyAddress.street}
              onChange={(event) =>
                set('companyAddress', { ...draft.companyAddress, street: event.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label={t('common.zip')}>
              <Input
                value={draft.companyAddress.zip}
                onChange={(event) =>
                  set('companyAddress', { ...draft.companyAddress, zip: event.target.value })
                }
              />
            </Field>
            <div className="col-span-2">
              <Field label={t('common.city')}>
                <Input
                  value={draft.companyAddress.city}
                  onChange={(event) =>
                    set('companyAddress', { ...draft.companyAddress, city: event.target.value })
                  }
                />
              </Field>
            </div>
          </div>
          <Field label={t('common.phone')}>
            <Input
              type="tel"
              value={draft.companyPhone}
              onChange={(event) => set('companyPhone', event.target.value)}
            />
          </Field>
          <Field label={t('common.email')}>
            <Input
              type="email"
              value={draft.companyEmail}
              onChange={(event) => set('companyEmail', event.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('settings.logo')}>
              <div className="flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- Data-URL aus den Einstellungen */}
                <img
                  src={isBrandLogo(draft.companyLogo) ? BRAND_LOGO_SRC : draft.companyLogo}
                  alt=""
                  data-testid="settings-logo"
                  className="h-14 w-auto max-w-[180px] rounded border bg-white object-contain p-1"
                />
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="h-11 max-w-xs"
                  data-testid="logo-upload"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => set('companyLogo', String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
                {isBrandLogo(draft.companyLogo) ? null : (
                  <Button
                    variant="outline"
                    className="h-11"
                    data-testid="logo-reset"
                    onClick={() => set('companyLogo', BRAND_LOGO_DATA_URL)}
                  >
                    {t('settings.logoReset')}
                  </Button>
                )}
              </div>
            </Field>
            <p className="pt-1 text-xs text-muted-foreground">{t('settings.logoHint')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={t('settings.profileName')}>
            <Input
              data-testid="profile-name"
              value={draft.profileName}
              onChange={(event) => set('profileName', event.target.value)}
            />
          </Field>
          <Field label={t('common.email')}>
            <Input
              type="email"
              value={draft.profileEmail}
              onChange={(event) => set('profileEmail', event.target.value)}
            />
          </Field>
          <Field label={t('settings.role')}>
            <Input value={draft.profileRole} onChange={(event) => set('profileRole', event.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.appearance')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={t('settings.language')}>
            <Select
              value={draft.language}
              onValueChange={(value) => set('language', value as Language)}
            >
              <SelectTrigger className="w-full" data-testid="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t('settings.theme')}>
            <Select value={draft.theme} onValueChange={(value) => set('theme', value as ThemeMode)}>
              <SelectTrigger className="w-full" data-testid="theme-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.theme.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.theme.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.theme.system')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.billing')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={t('settings.currency')}>
            <Input value={draft.currency} onChange={(event) => set('currency', event.target.value)} />
          </Field>
          <Field label={t('settings.vatRate')}>
            <Input
              type="number"
              step="0.1"
              value={draft.vatRate}
              onChange={(event) => set('vatRate', Number(event.target.value))}
            />
          </Field>
          <Field label={t('settings.hourlyRate')}>
            <Input
              type="number"
              step="0.05"
              data-testid="hourly-rate"
              value={draft.hourlyRate ?? ''}
              onChange={(event) =>
                set('hourlyRate', event.target.value === '' ? undefined : Number(event.target.value))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.legionella')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={`${t('legionella.hotTemp')} (min. °C)`}>
            <Input
              type="number"
              step="1"
              data-testid="legionella-hot-min"
              value={draft.legionellaHotMin}
              onChange={(event) => set('legionellaHotMin', Number(event.target.value))}
            />
          </Field>
          <Field label={`${t('legionella.coldTemp')} (max. °C)`}>
            <Input
              type="number"
              step="1"
              data-testid="legionella-cold-max"
              value={draft.legionellaColdMax}
              onChange={(event) => set('legionellaColdMax', Number(event.target.value))}
            />
          </Field>
          <Field label={`${t('legionella.cfu')} (${t('legionella.warning')})`}>
            <Input
              type="number"
              step="10"
              data-testid="legionella-warn-cfu"
              value={draft.legionellaWarnCfu}
              onChange={(event) => set('legionellaWarnCfu', Number(event.target.value))}
            />
          </Field>
          <Field label={`${t('legionella.cfu')} (${t('legionella.critical')})`}>
            <Input
              type="number"
              step="10"
              data-testid="legionella-limit-cfu"
              value={draft.legionellaLimitCfu}
              onChange={(event) => set('legionellaLimitCfu', Number(event.target.value))}
            />
          </Field>
          <Field label={t('legionella.intervalMonths')}>
            <Input
              type="number"
              step="1"
              data-testid="legionella-interval"
              value={draft.legionellaIntervalMonths}
              onChange={(event) => set('legionellaIntervalMonths', Number(event.target.value))}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.cleaning')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.cleaningHint')}</p>
          <Field label={t('settings.cleaningCleaner')}>
            <Select
              value={draft.cleaningCleanerId || 'none'}
              onValueChange={(value) => set('cleaningCleanerId', value === 'none' ? '' : value)}
            >
              <SelectTrigger data-testid="settings-cleaner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.none')}</SelectItem>
                {cleaners.map((cleaner) => (
                  <SelectItem key={cleaner.id} value={cleaner.id}>
                    {[cleaner.firstName, cleaner.name].filter(Boolean).join(' ') || cleaner.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm">{t('settings.cleaningOwnOnly')}</span>
            <Switch
              checked={draft.cleaningOwnTasksOnly}
              onCheckedChange={(checked) => set('cleaningOwnTasksOnly', checked)}
              data-testid="settings-cleaning-own"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm">{t('settings.notificationsOn')}</span>
            <Switch
              checked={draft.notificationsEnabled}
              onCheckedChange={(checked) => set('notificationsEnabled', checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm">{t('settings.emailNotifications')}</span>
            <Switch
              checked={draft.emailNotifications}
              onCheckedChange={(checked) => set('emailNotifications', checked)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.data')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.storageInfo')}</p>
          <p className="text-sm">
            {t('settings.storageUsed')}: {formatBytes(usage)} / {formatBytes(STORAGE_BUDGET)}
          </p>
          <Button variant="outline" onClick={() => setResetOpen(true)} data-testid="reset-data">
            {t('settings.reset')}
          </Button>
        </CardContent>
      </Card>

      <div className="safe-bottom sticky bottom-16 flex justify-end gap-2 rounded-xl border bg-card/95 p-3 backdrop-blur lg:bottom-4">
        <Button variant="outline" onClick={() => setDraft(settings)} data-testid="settings-cancel">
          {t('action.cancel')}
        </Button>
        <Button
          data-testid="settings-save"
          onClick={() => {
            save(draft);
            toast.success(t('settings.saved'));
          }}
        >
          {t('action.save')}
        </Button>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.reset')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.resetConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="reset-confirm"
              onClick={() => {
                clearAll();
                toast.success(t('toast.deleted'));
              }}
            >
              {t('action.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
