'use client';

/** Sprachumschaltung und Uebersetzungsfunktion. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Language, TranslationKey } from '@/lib/i18n/dictionary';
import { table as german } from '@/lib/i18n/generated/de';

/** Nur die aktive Sprache wird geladen; Deutsch liegt als Rueckfall bereit. */
const LOADERS: Record<Language, () => Promise<{ table: Record<string, string> }>> = {
  de: async () => ({ table: german }),
  fr: () => import('@/lib/i18n/generated/fr'),
  it: () => import('@/lib/i18n/generated/it'),
  en: () => import('@/lib/i18n/generated/en'),
};

interface I18nContextValue {
  language: Language;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const format = (text: string, values?: Record<string, string | number>): string => {
  if (!values) return text;
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text,
  );
};

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState<Record<string, Record<string, string>>>({ de: german });
  const table = loaded[language] ?? german;

  useEffect(() => {
    if (loaded[language]) return;
    let active = true;
    LOADERS[language]().then((module) => {
      if (active) setLoaded((current) => ({ ...current, [language]: module.table }));
    });
    return () => {
      active = false;
    };
  }, [language, loaded]);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      format(table[key] ?? german[key] ?? key, values),
    [table],
  );

  const value = useMemo<I18nContextValue>(() => ({ language, t }), [language, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('I18nProvider fehlt');
  return context;
};

/** Kurzform fuer Komponenten, die nur uebersetzen. */
export const useT = () => useI18n().t;

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'en', label: 'English' },
];
