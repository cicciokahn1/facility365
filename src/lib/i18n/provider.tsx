'use client';

/** Sprachumschaltung und Uebersetzungsfunktion. */
import { createContext, useCallback, useContext, useMemo } from 'react';

import { Language, TranslationKey, dictionary } from '@/lib/i18n/dictionary';

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
  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      format(dictionary[key][language], values),
    [language],
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
