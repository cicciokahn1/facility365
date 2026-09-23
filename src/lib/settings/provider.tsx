'use client';

/**
 * Anwendungseinstellungen.
 *
 * Persoenliche Einstellungen wirken konto-bezogen, die Modulkonfiguration
 * mandantenweit. Paket- und Modulschalter werden beim Aendern gespeichert;
 * die uebrigen Felder bleiben bis zum Speichern ein Entwurf.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/lib/auth/provider';
import { BRAND_LOGO_DATA_URL } from '@/lib/branding/logo';
import { localRepository } from '@/lib/data/repository';
import { supabaseRepository } from '@/lib/data/supabase-repository';
import { I18nProvider } from '@/lib/i18n/provider';
import { normalizePackage, OPTIONAL_MODULES } from '@/lib/packages/packages';
import { AppSettings, ModuleKey, ThemeMode } from '@/lib/types';

export const defaultSettings: AppSettings = {
  companyName: 'Facility365',
  companyLogo: BRAND_LOGO_DATA_URL,
  companyAddress: { street: '', zip: '', city: '', country: 'Schweiz' },
  companyPhone: '',
  companyEmail: '',
  companyVat: '',
  language: 'de',
  theme: 'system',
  profileName: '',
  profileEmail: '',
  profileRole: '',
  currency: 'CHF',
  vatRate: 8.1,
  roleHourlyRates: {},
  cleanerRoleHourlyRates: {},
  paymentRecipient: 'Facility365',
  paymentAddress: { street: '', zip: '', city: '', country: 'Schweiz' },
  paymentIban: '',
  paymentQrIban: '',
  paymentBank: '',
  paymentBic: '',
  paymentReferenceType: 'QRR',
  legionellaHotMin: 60,
  legionellaColdMax: 25,
  legionellaWarnCfu: 100,
  legionellaLimitCfu: 1000,
  legionellaIntervalMonths: 12,
  notificationsEnabled: true,
  emailNotifications: false,
  cleaningCleanerId: '',
  cleaningOwnTasksOnly: false,
  technicalChecklistTemplates: {},
  activeUserId: '',
  industryPackage: '',
  disabledModules: [],
  subscription: {
    package: '',
    yearlyPrice: 0,
    setupFee: 0,
    contractStart: '',
    nextRenewal: '',
    currency: 'CHF',
  },
};

interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  /** Loest erst auf, wenn die Einstellungen dauerhaft gespeichert sind; verwirft bei Fehler. */
  save: (settings: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  /** Persoenliche Einstellungen gehoeren zum Konto; Module zum Mandanten. */
  const repository = auth.enabled ? supabaseRepository : localRepository;
  const scope =
    !auth.enabled
      ? 'local'
      : auth.ready && auth.user && auth.membership
        ? `${auth.user.id}:${auth.membership.tenantId}`
        : '';
  const [loaded, setLoaded] = useState<{ scope: string; settings: AppSettings }>({
    scope: '',
    settings: defaultSettings,
  });

  /** Zaehlt Speicherungen; ein spaeter eintreffender Ladevorgang darf sie nicht ueberschreiben. */
  const saveVersion = useRef(0);

  const current = loaded.scope === scope && scope !== '';
  const settings = current ? loaded.settings : defaultSettings;
  const ready = current;

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    const version = saveVersion.current;
    void Promise.all([
      repository.readSettings().catch(() => null),
      repository.readModuleConfig().catch(() => null),
      localRepository.readModuleConfig().catch(() => null),
    ]).then(([stored, remoteModules, localModules]) => {
      if (cancelled || saveVersion.current !== version) return;
      const modulesOf = (value: unknown): ModuleKey[] | null => {
        if (!Array.isArray(value)) return null;
        return value.filter(
          (module): module is ModuleKey =>
            typeof module === 'string' &&
            OPTIONAL_MODULES.includes(module as ModuleKey),
        );
      };
      /**
       * Mandantenweite und konto-bezogene Konfiguration koennen auseinander
       * laufen, etwa wenn das Schreiben in den Mandanten nicht erlaubt ist.
       * Es gilt darum immer die zuletzt gespeicherte Fassung.
       */
      const candidates = [
        {
          modules: modulesOf(remoteModules?.disabledModules),
          industryPackage: remoteModules?.industryPackage,
          subscription: remoteModules?.subscription,
          stamp: remoteModules?.updatedAt ?? '',
        },
        {
          modules: modulesOf(stored?.disabledModules),
          industryPackage: stored?.industryPackage,
          subscription: stored?.subscription,
          stamp: stored?.modulesUpdatedAt ?? '',
        },
        {
          modules: modulesOf(localModules?.disabledModules),
          industryPackage: localModules?.industryPackage,
          subscription: localModules?.subscription,
          stamp: localModules?.updatedAt ?? '',
        },
      ].filter((entry) => entry.modules !== null);
      const newest = candidates.reduce<(typeof candidates)[number] | null>(
        (best, entry) => (best === null || entry.stamp > best.stamp ? entry : best),
        null,
      );
      const tenant = candidates[0];
      const sourceCandidate =
        auth.enabled && tenant?.modules !== null && tenant?.modules !== undefined
          ? tenant
          : newest;
      const source = {
        modules: sourceCandidate?.modules ?? [],
        industryPackage: sourceCandidate?.industryPackage,
        stamp: sourceCandidate?.stamp ?? '',
        subscription: sourceCandidate?.subscription,
      };
      setLoaded({
        scope,
        settings: {
          ...defaultSettings,
          ...(stored ?? {}),
          industryPackage: normalizePackage(source.industryPackage),
          disabledModules: source.modules,
          modulesUpdatedAt: source.stamp || undefined,
          subscription: source.subscription ?? defaultSettings.subscription,
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [auth.enabled, repository, scope]);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);

  useEffect(() => {
    if (settings.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyTheme('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings.theme]);

  const save = useCallback(
    (next: AppSettings) => {
      const stamp = new Date().toISOString();
      const saved: AppSettings = { ...next, modulesUpdatedAt: stamp };
      const version = saveVersion.current + 1;
      const previous = loaded;
      saveVersion.current = version;
      setLoaded({ scope, settings: saved });
      const config = {
        industryPackage: saved.industryPackage,
        disabledModules: saved.disabledModules,
        subscription: saved.subscription,
        updatedAt: stamp,
      };
      if (repository !== localRepository) {
        void localRepository.writeModuleConfig(config).catch(() => undefined);
      }
      return Promise.all([
        repository.writeSettings(saved),
        repository.writeModuleConfig(config),
      ])
        .then(() => undefined)
        .catch((error: unknown) => {
          if (saveVersion.current === version) setLoaded(previous);
          throw error;
        });
    },
    [loaded, repository, scope],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, ready, save }),
    [settings, ready, save],
  );

  return (
    <SettingsContext.Provider value={value}>
      <I18nProvider language={settings.language}>{children}</I18nProvider>
    </SettingsContext.Provider>
  );
}

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('SettingsProvider fehlt');
  return context;
};

/** Anzeigename des angemeldeten Benutzers; leer, solange kein Profil erfasst ist. */
export const useCurrentUser = (): string => {
  const { settings } = useSettings();
  return settings.profileName.trim() || settings.companyName;
};
