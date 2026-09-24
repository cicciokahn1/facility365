'use client';

/**
 * Einstellungen.
 *
 * Es wird mit einem Entwurf gearbeitet: nichts wirkt vor dem Speichern,
 * Abbrechen stellt den gespeicherten Stand wieder her.
 */
import Link from 'next/link';
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
import { INTEGRATIONS } from '@/lib/integrations/registry';
import { moduleByKey } from '@/lib/modules';
import { usePushPermission } from '@/lib/notifications/reminders';
import { registerPushSubscription } from '@/lib/notifications/push-subscription';
import {
  OPTIONAL_MODULES,
  CORE_MODULES,
  PACKAGE_KEYS,
  disabledByPackage,
  packagePrice,
  packageLabelKey,
  packageTargetKey,
} from '@/lib/packages/packages';
import { useSettings } from '@/lib/settings/provider';
import {
  AppSettings,
  IndustryPackage,
  Language,
  ModuleKey,
  OrganizationSubscription,
  ThemeMode,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatBytes, formatMoney } from '@/lib/utils/format';

/** Das Formular wird erst eingehaengt, wenn die gespeicherten Werte vorliegen. */
export default function SettingsPage() {
  const t = useT();
  const { settings, ready } = useSettings();
  if (!ready) return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  return <SettingsForm settings={settings} />;
}

function SettingsForm({ settings }: { settings: AppSettings }) {
  const t = useT();
  const { settings: live, save } = useSettings();
  const push = usePushPermission();
  const clearAll = useClearAllData();
  const cleaners = useCollectionItems('cleaners');
  const users = useCollectionItems('users');
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [usage] = useState(() => storageUsage());
  const [resetOpen, setResetOpen] = useState(false);
  const subscription: OrganizationSubscription = draft.subscription ?? {
    package: draft.industryPackage,
    yearlyPrice: packagePrice(draft.industryPackage)?.yearly ?? 0,
    setupFee: 0,
    contractStart: '',
    nextRenewal: '',
    currency: 'CHF',
  };

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const enablePush = async () => {
    if (push.install) {
      toast.info(t('notify.installTitle'), { description: t('notify.installHint') });
      return;
    }
    const result = await push.request();
    if (result === 'granted') {
      const registered = await registerPushSubscription().catch(() => false);
      set('notificationsEnabled', true);
      toast.success(registered ? t('notify.enabled') : t('notify.enabledLocal'));
    } else if (result === 'denied') {
      toast.error(t('notify.denied'));
    } else {
      toast.info(t('notify.unsupported'));
    }
  };

  /**
   * Paket und Modulschalter wirken sofort und werden sofort gespeichert, damit
   * sie auch beim Wechsel auf eine andere Seite erhalten bleiben. Uebrige
   * Felder bleiben bis zum Speichern ein Entwurf.
   */
  const persist = async (next: AppSettings) => {
    try {
      await save(next);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(
        `${t('settings.saveFailed')} ${error instanceof Error ? error.message : ''}`.trim(),
      );
    }
  };

  const applyModules = (industryPackage: IndustryPackage, disabledModules: ModuleKey[]) => {
    const yearly = packagePrice(industryPackage)?.yearly;
    const nextSubscription: OrganizationSubscription = {
      ...subscription,
      package: industryPackage,
      yearlyPrice:
        subscription.package === industryPackage || yearly === undefined
          ? subscription.yearlyPrice
          : yearly,
    };
    setDraft((current) => ({ ...current, industryPackage, disabledModules, subscription: nextSubscription }));
    void persist({ ...live, industryPackage, disabledModules, subscription: nextSubscription });
  };

  /** Paket = Ausgangskonfiguration; Schalter darunter sind die Ueberschreibung und haben Vorrang. */
  const choosePackage = (key: IndustryPackage) =>
    applyModules(key, key === 'custom' ? draft.disabledModules : disabledByPackage(key));

  const toggleModule = (module: ModuleKey, active: boolean) =>
    applyModules(
      draft.industryPackage,
      active
        ? draft.disabledModules.filter((key) => key !== module)
        : draft.disabledModules.includes(module)
          ? draft.disabledModules
          : [...draft.disabledModules, module],
    );

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
          <CardTitle className="text-base">{t('settings.subscription')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.subscriptionHint')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('settings.package')}>
              <Select
                value={subscription.package || 'all'}
                onValueChange={(value) => {
                  const nextPackage = value === 'all' ? '' : (value as IndustryPackage);
                  choosePackage(nextPackage);
                }}
              >
                <SelectTrigger data-testid="subscription-package"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PACKAGE_KEYS.map((key) => (
                    <SelectItem key={key || 'all'} value={key || 'all'}>
                      {t(packageLabelKey(key))}
                      {key
                        ? ` · ${packagePrice(key)?.yearly === undefined ? t('settings.individualPrice') : formatMoney(packagePrice(key)?.yearly ?? 0)} / Jahr`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={`${t('settings.yearlyPrice')} (CHF)`}>
              <Input
                type="number"
                min="0"
                step="100"
                value={subscription.yearlyPrice}
                onChange={(event) =>
                  set('subscription', { ...subscription, yearlyPrice: Number(event.target.value) || 0 })
                }
                data-testid="subscription-yearly-price"
              />
            </Field>
            <Field label={`${t('settings.setupFee')} (CHF)`}>
              <Input
                type="number"
                min="0"
                step="100"
                value={subscription.setupFee}
                onChange={(event) =>
                  set('subscription', { ...subscription, setupFee: Number(event.target.value) || 0 })
                }
                data-testid="subscription-setup-fee"
              />
            </Field>
            <Field label={t('settings.contractStart')}>
              <Input
                type="date"
                value={subscription.contractStart}
                onChange={(event) =>
                  set('subscription', { ...subscription, contractStart: event.target.value })
                }
                data-testid="subscription-contract-start"
              />
            </Field>
            <Field label={t('settings.nextRenewal')}>
              <Input
                type="date"
                value={subscription.nextRenewal}
                onChange={(event) =>
                  set('subscription', { ...subscription, nextRenewal: event.target.value })
                }
                data-testid="subscription-next-renewal"
              />
            </Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">
              {t('settings.activeModules')}: {CORE_MODULES.length + OPTIONAL_MODULES.filter((module) => !draft.disabledModules.includes(module)).length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...CORE_MODULES, ...OPTIONAL_MODULES.filter((module) => !draft.disabledModules.includes(module))]
                .map((module) => (
                  <span key={module} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                    {t(moduleByKey(module).labelKey)}
                  </span>
                ))}
            </div>
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
          <Field label={t('user.signedInAs')}>
            <Select
              value={draft.activeUserId || 'none'}
              onValueChange={(value) => set('activeUserId', value === 'none' ? '' : value)}
            >
              <SelectTrigger className="w-full" data-testid="active-user-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('common.notSet')}</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email || user.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">{t('user.signedInHint')}</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.paymentData')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label={t('settings.paymentRecipient')}>
            <Input value={draft.paymentRecipient} onChange={(event) => set('paymentRecipient', event.target.value)} />
          </Field>
          <Field label={t('settings.paymentBank')}>
            <Input value={draft.paymentBank} onChange={(event) => set('paymentBank', event.target.value)} />
          </Field>
          <Field label={t('settings.paymentIban')}>
            <Input value={draft.paymentIban} onChange={(event) => set('paymentIban', event.target.value)} />
          </Field>
          <Field label={t('settings.paymentQrIban')}>
            <Input value={draft.paymentQrIban} onChange={(event) => set('paymentQrIban', event.target.value)} />
          </Field>
          <Field label={t('settings.paymentBic')}>
            <Input value={draft.paymentBic} onChange={(event) => set('paymentBic', event.target.value)} />
          </Field>
          <Field label={t('settings.paymentReferenceType')}>
            <Select
              value={draft.paymentReferenceType}
              onValueChange={(value) => set('paymentReferenceType', value as AppSettings['paymentReferenceType'])}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="QRR">QR-Referenz</SelectItem>
                <SelectItem value="SCOR">Creditor Reference (SCOR)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('settings.paymentAddress')}>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder={t('common.street')}
                  value={draft.paymentAddress.street}
                  onChange={(event) => set('paymentAddress', { ...draft.paymentAddress, street: event.target.value })}
                />
                <Input
                  placeholder={`${t('common.zip')} / ${t('common.city')}`}
                  value={[draft.paymentAddress.zip, draft.paymentAddress.city].filter(Boolean).join(' ')}
                  onChange={(event) => {
                    const [zip = '', ...city] = event.target.value.split(' ');
                    set('paymentAddress', { ...draft.paymentAddress, zip, city: city.join(' ') });
                  }}
                />
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.package')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.packageHint')}</p>
          <Field label={t('settings.package')}>
            <Select
              value={draft.industryPackage || 'all'}
              onValueChange={(value) =>
                choosePackage(value === 'all' ? '' : (value as IndustryPackage))
              }
            >
              <SelectTrigger className="w-full" data-testid="package-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_KEYS.map((key) => (
                  <SelectItem key={key || 'all'} value={key || 'all'}>
                    <span className="flex flex-col">
                      <span>{t(packageLabelKey(key))}</span>
                      {packageTargetKey(key) && (
                        <span className="block text-xs text-muted-foreground">
                          {t(packageTargetKey(key)!)}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {packageTargetKey(draft.industryPackage) && (
              <p className="text-xs text-muted-foreground">
                {t('package.targetGroup')}: {t(packageTargetKey(draft.industryPackage)!)}
              </p>
            )}
          </Field>
          <div className="grid gap-1 sm:grid-cols-2" data-testid="package-modules">
            {OPTIONAL_MODULES.map((module) => (
              <label
                key={module}
                className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
              >
                <span className="text-sm">{t(moduleByKey(module).labelKey)}</span>
                <Switch
                  checked={!draft.disabledModules.includes(module)}
                  onCheckedChange={(checked) => toggleModule(module, checked)}
                  data-testid={`package-module-${module}`}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('settings.moduleOverrideHint')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.integrations')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.integrationsHint')}</p>
          <ul className="grid gap-2 sm:grid-cols-2" data-testid="integration-list">
            {INTEGRATIONS.map((integration) => (
              <li
                key={integration.key}
                data-testid={`integration-${integration.key}`}
                className="flex flex-col gap-1 rounded-lg border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t(integration.labelKey)}</span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px]',
                      integration.status === 'available'
                        ? 'border-success/40 text-success'
                        : 'text-muted-foreground',
                    )}
                  >
                    {t(
                      integration.status === 'available'
                        ? 'integration.available'
                        : 'integration.prepared',
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{t(integration.textKey)}</p>
                {integration.href ? (
                  <Link
                    href={integration.href}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t('settings.integrationOpen')}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
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
              data-testid="settings-push-toggle"
            />
          </label>
          {draft.notificationsEnabled && push.permission !== 'granted' ? (
            <Button variant="outline" className="w-fit" onClick={() => void enablePush()} data-testid="settings-push-enable">
              {t('notify.enable')}
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {push.permission === 'granted'
              ? t('notify.active')
              : push.permission === 'denied'
                ? t('notify.denied')
                : push.install
                  ? t('notify.installHint')
                  : t('settings.pushHint')}
          </p>
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
          <CardTitle className="text-base">{t('settings.account')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{t('settings.accountHint')}</p>
          <Button variant="outline" asChild data-testid="settings-account">
            <Link href="/account">{t('account.title')}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">{t('settings.trashHint')}</p>
          <Button variant="outline" asChild data-testid="settings-trash">
            <Link href="/trash">{t('trash.title')}</Link>
          </Button>
          <p className="text-sm text-muted-foreground">{t('help.intro')}</p>
          <Button variant="outline" asChild data-testid="settings-help">
            <Link href="/help">{t('help.title')}</Link>
          </Button>
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
        <Button variant="outline" onClick={() => setDraft(live)} data-testid="settings-cancel">
          {t('action.cancel')}
        </Button>
        <Button
          data-testid="settings-save"
          onClick={() => void persist(draft)}
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
