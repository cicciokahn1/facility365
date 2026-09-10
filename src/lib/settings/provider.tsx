'use client';

/**
 * Anwendungseinstellungen.
 *
 * Die Einstellungen wirken global (Sprache, Erscheinungsbild, Firmenangaben)
 * und werden mit einem Entwurf bearbeitet: nichts wirkt vor dem Speichern.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth/provider';
import { BRAND_LOGO_DATA_URL } from '@/lib/branding/logo';
import { localRepository } from '@/lib/data/repository';
import { supabaseRepository } from '@/lib/data/supabase-repository';
import { I18nProvider } from '@/lib/i18n/provider';
import { AppSettings, ThemeMode } from '@/lib/types';

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
  activeUserId: '',
  industryPackage: '',
  disabledModules: [],
};

interface SettingsContextValue {
  settings: AppSettings;
  ready: boolean;
  save: (settings: AppSettings) => void;
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

  /** Einstellungen gehoeren zum Konto, nicht zum Geraet. */
  const repository = auth.enabled ? supabaseRepository : localRepository;
  const scope = auth.enabled ? auth.user?.id ?? '' : 'local';
  const [loaded, setLoaded] = useState<{ scope: string; settings: AppSettings }>({
    scope: '',
    settings: defaultSettings,
  });

  const current = loaded.scope === scope && scope !== '';
  const settings = current ? loaded.settings : defaultSettings;
  const ready = current;

  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    void repository
      .readSettings()
      .catch(() => null)
      .then((stored) => {
        if (cancelled) return;
        setLoaded({ scope, settings: { ...defaultSettings, ...(stored ?? {}) } });
      });
    return () => {
      cancelled = true;
    };
  }, [repository, scope]);

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
      setLoaded({ scope, settings: next });
      void repository.writeSettings(next).catch(() => undefined);
    },
    [repository, scope],
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
