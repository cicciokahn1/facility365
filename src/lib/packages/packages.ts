/**
 * Branchenpakete.
 *
 * Facility365 bleibt ein System; je nach Kunde werden aber nur die Module
 * gebraucht, die zur Branche passen. Ein Paket ist deshalb nur eine Vorauswahl
 * abschaltbarer Module - abgeschaltete Module verschwinden aus Navigation und
 * Suche, ihre Daten bleiben vollstaendig erhalten und kehren beim Einschalten
 * unveraendert zurueck.
 *
 * Ohne gewaehltes Paket ist alles aktiv: bestehende Installationen bleiben
 * unveraendert.
 */
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { AppSettings, IndustryPackage, ModuleKey } from '@/lib/types';

/** Module, die jedes Paket enthaelt; sie lassen sich nicht abschalten. */
export const CORE_MODULES: ModuleKey[] = [
  'dashboard',
  'calendar',
  'today',
  'customers',
  'properties',
  'buildings',
  'rooms',
  'assets',
  'documents',
  'orders',
  'maintenances',
  'damages',
  'reports',
  'users',
  'activities',
  'settings',
];

/** Abschaltbare Module in der Reihenfolge der Navigation. */
export const OPTIONAL_MODULES: ModuleKey[] = [
  'organizations',
  'sites',
  'suppliers',
  'sources',
  'energy',
  'solarplants',
  'solaryields',
  'keys',
  'inventory',
  'tools',
  'vehicles',
  'stock',
  'legionella',
  'rcd',
  'inspections',
  'playgroundchecks',
  'firechecks',
  'audit',
  'handover',
  'cleaning',
  'cleaningtasks',
  'cleaningplans',
  'cleaningareas',
  'cleaners',
  'cleaningchecks',
  'cleaningcomplaints',
  'contracts',
  'quotes',
  'invoices',
  'analytics',
  'portal',
];

const CLEANING: ModuleKey[] = [
  'cleaning',
  'cleaningtasks',
  'cleaningplans',
  'cleaningareas',
  'cleaners',
  'cleaningchecks',
  'cleaningcomplaints',
];

const TECHNICS: ModuleKey[] = [
  'energy',
  'solarplants',
  'solaryields',
  'keys',
  'inventory',
  'tools',
  'stock',
];

const CONTROLS: ModuleKey[] = [
  'legionella',
  'rcd',
  'inspections',
  'playgroundchecks',
  'firechecks',
  'audit',
  'handover',
];

const STRUCTURE: ModuleKey[] = ['organizations', 'sites', 'suppliers', 'sources'];

const COMMERCE: ModuleKey[] = ['contracts', 'quotes', 'invoices', 'analytics', 'portal'];

/** Module je Paket; alles Uebrige ist in diesem Paket abgeschaltet. */
const PACKAGES: Record<Exclude<IndustryPackage, '' | 'custom'>, ModuleKey[]> = {
  /** Hauswartfirmen: der volle Umfang. */
  professional: OPTIONAL_MODULES,
  /** Immobilienverwaltung: Bestand, Betreiberpflichten und Kaufmaennisches. */
  property: [...STRUCTURE, ...TECHNICS, ...CONTROLS, ...COMMERCE, 'vehicles'],
  /** Alters- und Pflegeheime, Spitaeler: Hygiene, Reinigung und Nachweise. */
  care: [...STRUCTURE, ...TECHNICS, ...CONTROLS, ...CLEANING, 'contracts', 'analytics'],
  /** Soziale Institutionen, Wohnheime: Betrieb, Technik und Reinigung. */
  institution: [...STRUCTURE, ...TECHNICS, ...CONTROLS, ...CLEANING, 'contracts', 'analytics'],
  /** Industrie: Technik, Fahrzeuge, Werkzeuge und Kosten. */
  industry: [...STRUCTURE, ...TECHNICS, 'vehicles', ...CONTROLS, ...COMMERCE],
  /** Gemeinden und oeffentliche Verwaltungen: Betrieb, Reinigung und Berichte. */
  public: [
    ...STRUCTURE,
    ...TECHNICS,
    'vehicles',
    ...CONTROLS,
    ...CLEANING,
    'contracts',
    'analytics',
    'portal',
  ],
};

export const PACKAGE_KEYS: IndustryPackage[] = [
  '',
  'professional',
  'property',
  'care',
  'institution',
  'industry',
  'public',
  'custom',
];

export const packageLabelKey = (key: IndustryPackage): TranslationKey => {
  if (key === '') return 'package.all';
  if (key === 'custom') return 'package.custom';
  return `package.${key}` as TranslationKey;
};

export const packageTargetKey = (key: IndustryPackage): TranslationKey | null => {
  if (key === '') return null;
  return `package.${key}.target` as TranslationKey;
};

/** Preise werden spaeter zentral hier hinterlegt; solange leer, zeigt die App keine Preise. */
export interface PackagePrice {
  currency: 'CHF';
  monthly?: number;
  yearly?: number;
  perUser?: boolean;
}

export const PACKAGE_PRICES: Partial<
  Record<Exclude<IndustryPackage, ''>, PackagePrice>
> = {};

export const packagePrice = (key: IndustryPackage): PackagePrice | undefined =>
  key === '' ? undefined : PACKAGE_PRICES[key];

export const normalizePackage = (value: string | undefined): IndustryPackage => {
  if (value === 'school') return 'public';
  if (PACKAGE_KEYS.includes(value as IndustryPackage)) return value as IndustryPackage;
  return '';
};

/** Module, die ein Paket abschaltet. */
export const disabledByPackage = (key: IndustryPackage): ModuleKey[] => {
  if (key === '' || key === 'custom') return [];
  const included = PACKAGES[key];
  return OPTIONAL_MODULES.filter((module) => !included.includes(module));
};

/** Ist das Modul in dieser Installation aktiv? */
export const moduleEnabled = (settings: AppSettings, module: ModuleKey): boolean => {
  if (!OPTIONAL_MODULES.includes(module)) return true;
  return !(settings.disabledModules ?? []).includes(module);
};
