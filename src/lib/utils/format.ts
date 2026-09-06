/** Formatierung von Datum, Zahlen und Betraegen in Schweizer Schreibweise. */
import type { Language } from '@/lib/i18n/dictionary';

const LOCALES: Record<Language, string> = {
  de: 'de-CH',
  fr: 'fr-CH',
  it: 'it-CH',
  en: 'en-CH',
};

export const formatDate = (value: string, language: Language): string => {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(LOCALES[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/** Zahl in Schweizer Schreibweise, z. B. 2'000. */
export const formatNumber = (value: number, language: Language): string =>
  new Intl.NumberFormat(LOCALES[language]).format(value);

/** Monat als "Maerz 2026"; erwartet YYYY-MM. */
export const formatMonth = (value: string, language: Language): string => {
  if (!value) return '–';
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(LOCALES[language], { month: 'long', year: 'numeric' }).format(date);
};

export const formatDateTime = (value: string, language: Language): string => {
  if (!value) return '–';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(LOCALES[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Betrag mit Waehrung.
 *
 * Die Zifferngruppen werden bewusst mit einem festen Trennzeichen gesetzt:
 * Server und Browser liefern sonst je nach ICU-Fassung unterschiedliche
 * Apostrophe, was React beim ersten Rendern als Abweichung meldet.
 */
export const formatMoney = (value: number, currency = 'CHF'): string => {
  const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
  const [whole, fraction = '00'] = Math.abs(rounded).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2019');
  return `${rounded < 0 ? '-' : ''}${currency} ${grouped}.${fraction}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** ISO-Datum von heute, wie es Datumsfelder erwarten. */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Tage bis zum Datum; negativ, wenn es in der Vergangenheit liegt. */
export const daysUntil = (value: string): number | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - start.getTime()) / 86400000);
};

export const initials = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'F3';
