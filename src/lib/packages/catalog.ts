/**
 * Verkaufskatalog fuer die Preisseite.
 *
 * Alles Preis- und Textrelevante steht hier zentral: Paketbeschreibungen,
 * Zielgruppen, Modulgruppen, Monats- und Jahrespreise, Einrichtungsgebuehren
 * und Zusatzmodule. Die Paketliste selbst bleibt in packages.ts -
 * diese Datei ergaenzt nur die Darstellung.
 *
 * OFFENE ENTSCHEIDUNGEN (vor dem Go-live festlegen):
 * - SETUP_FEE: konkrete einmalige Einrichtungsbetruege je Paket.
 *   null = wird im Angebot individuell ausgewiesen.
 * - ADDON_PRICE: Monatspreis je Zusatzmodul. null = auf Anfrage.
 * - CONTRACT_NOTE: Vertragslaufzeit/Kuendigungsfrist noch nicht festgelegt;
 *   die Seite weist deshalb nur den Jahrespreis als Grundlage aus.
 */
import type { IndustryPackage, ModuleKey } from '@/lib/types';
import { disabledByPackage, OPTIONAL_MODULES, PACKAGE_PRICES } from './packages';

/** Anzeigereihenfolge der Pakete auf der Preisseite. */
export const CATALOG_ORDER: Exclude<IndustryPackage, '' | 'custom'>[] = [
  'starter',
  'property',
  'industry',
  'care',
  'public',
  'hospital',
  'professional',
  'enterprise',
];

/** Modulgruppen fuer die verstaendliche Darstellung (deutsch). */
export interface ModuleGroup {
  title: string;
  description: string;
  modules: ModuleKey[];
}

export const MODULE_GROUPS: Record<string, ModuleGroup> = {
  structure: {
    title: 'Struktur und Partner',
    description: 'Organisationen, Standorte, Lieferanten und Bezugsqüllen verwalten.',
    modules: ['organizations', 'sites', 'suppliers', 'sources'],
  },
  technics: {
    title: 'Technik und Material',
    description: 'Energie, Solaranlagen, Schlüssel, Inventar, Werkzeuge und Lager.',
    modules: ['energy', 'solarplants', 'solaryields', 'keys', 'inventory', 'tools', 'stock'],
  },
  controls: {
    title: 'Kontrollen und Nachweise',
    description:
      'Legionella, Elektro (NIV/RCD), Inspektionen, Spielplatz- und Brandchecks, Audits, Begehungen und Übergaben.',
    modules: ['legionella', 'rcd', 'inspections', 'playgroundchecks', 'firechecks', 'audit', 'walkthrough', 'handover'],
  },
  cleaning: {
    title: 'Reinigung',
    description:
      'Reinigungspläne, Flächen, Mitarbeitende, Aufgaben, Qualitätskontrollen und Reklamationen.',
    modules: ['cleaning', 'cleaningtasks', 'cleaningplans', 'cleaningareas', 'cleaners', 'cleaningchecks', 'cleaningcomplaints'],
  },
  commerce: {
    title: 'Kaufmännisch',
    description: 'Verträge, Offerten, Rechnungen, Auswertungen und Kundenportal.',
    modules: ['contracts', 'quotes', 'invoices', 'analytics', 'portal'],
  },
};

export interface PackageInfo {
  /** Ein Satz, was das Paket ist. */
  summary: string;
  /** Fuer wen es gedacht ist. */
  target: string;
  /** Konkreter Nutzen fuer diese Zielgruppe. */
  benefit: string;
  /** Warum dieses Paket statt eines anderen. */
  whyThis: string;
  /** Modulgruppen-Schluessel, die das Paket enthaelt. */
  groups: string[];
  /** Zusaetzliche Einzelmodule ausserhalb der Gruppen. */
  extraModules: ModuleKey[];
  /** true = Preis ist ein Einstiegspreis («ab CHF …»). */
  priceFrom?: boolean;
}

export const PACKAGE_INFO: Record<Exclude<IndustryPackage, '' | 'custom'>, PackageInfo> = {
  starter: {
    summary: 'Der Einstieg für einzelne Hauswarte und kleine Betriebe.',
    target: 'Einzelne Hauswarte, kleine Hauswartungsbetriebe und kleine Organisationen.',
    benefit:
      'Liegenschaften, Aufträge, Wartungen, Schäden und Rapporte in einer App - mobil und offline nutzbar, ohne Einführungsprojekt.',
    whyThis:
      'Der günstigste Einstieg: alle Kernfunktionen für den Hauswart-Alltag, ohne Branchenmodule. Aufwertung auf ein Branchenpaket jederzeit möglich.',
    groups: [],
    extraModules: [],
  },
  professional: {
    summary: 'Das Komplettpaket für Facility-Management- und Hauswartbetriebe.',
    target: 'Hauswartfirmen und FM-Dienstleister, die mehrere Liegenschaften für Kunden betreuen.',
    benefit:
      'Alle Module in einem System: vom Auftrag über Wartung, Kontrollen und Reinigung bis zu Offerten und Rechnungen.',
    whyThis:
      'Das Komplettpaket: höchste Stufe mit festem Preis - alles enthalten, nichts dazubuchen, keine Überraschungen.',
    groups: ['structure', 'technics', 'controls', 'cleaning', 'commerce'],
    extraModules: ['visitors', 'parking', 'waste', 'hazards'],
  },
  property: {
    summary: 'Das Paket für Immobilienverwaltungen und Bewirtschafter.',
    target: 'Verwaltungen, die Liegenschaften im eigenen oder fremden Auftrag bewirtschaften.',
    benefit:
      'Betreiberpflichten dokumentiert erfüllen: Kontrollen, Wartungen und Schäden je Liegenschaft lückenlos nachweisen - plus Verträge, Offerten und Rechnungen.',
    whyThis:
      'Deckt Bewirtschaftung und kaufmännische Arbeit ab, ohne den Reinigungsbetrieb, den eine Verwaltung selten selbst führt.',
    groups: ['structure', 'technics', 'controls', 'commerce'],
    extraModules: ['vehicles'],
  },
  care: {
    summary: 'Das Paket für Pflege- und Betreuungseinrichtungen.',
    target: 'Alters- und Pflegeheime sowie betreute Wohnformen. Für Spitäler und Kliniken ist Facility365 Hospital vorgesehen.',
    benefit:
      'Hygiene im Griff: Reinigungspläne und -kontrollen, Legionella- und Sicherheitsnachweise sowie einwandfreie Dokumentation für Audits.',
    whyThis:
      'Einzige Stufe mit vollem Reinigungsbereich plus kompletten Kontrollen - die Nachweispflichten im Pflegealltag sind damit abgedeckt.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['contracts', 'analytics'],
  },
  /** Legacy-Paket: nicht mehr verkauft, bestehende Mandanten laufen weiter. */
  institution: {
    summary: 'Das Paket für soziale Institutionen und Wohnheime (nicht mehr verkauft).',
    target: 'Wohnheime, Werkstätten, Tagesstätten und gemeinnützige Trägerschaften.',
    benefit:
      'Betrieb, Technik und Reinigung in einem Werkzeug: Aufträge verteilen, Kontrollen führen und Reinigungsqualität sichern - auch mit wechselnden Teams.',
    whyThis:
      'Wird nicht mehr angeboten: wohnorientierte Fälle laufen über Care, öffentliche und soziale Einrichtungen über Public, komplexe Fälle über Enterprise.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['contracts', 'analytics'],
  },
  industry: {
    summary: 'Das Paket für Industrie- und Produktionsbetriebe.',
    target: 'Industrieunternehmen mit eigenem Unterhalts- und Facility-Team.',
    benefit:
      'Fuhrpark, Werkzeuge, Lager und Gefahrstoffe im Griff, dazu die gesetzlichen Kontrollen und das Kaufmännische für externe Aufträge.',
    whyThis:
      'Vollausstattung für technische Betriebe - ohne Reinigungsbereich, den Industriebetriebe meist extern vergeben.',
    groups: ['structure', 'technics', 'controls', 'commerce'],
    extraModules: ['vehicles', 'hazards'],
  },
  public: {
    summary: 'Das Paket für Gemeinden und öffentliche Verwaltungen.',
    target:
      'Gemeinden, Städte, Schulen, Werkhöfe sowie öffentliche und soziale Einrichtungen.',
    benefit:
      'Vom Schulhaus bis zur Werkhalle: Kontrollen (Spielplatz, Brandschutz, Legionella), Reinigung, Aufträge und ein Meldeportal für die Bevölkerung.',
    whyThis:
      'Die breiteste Stufe nach Professional: enthält Reinigung und das Bürgermelde-Portal - die beiden Dinge, die eine Gemeinde braucht. Auch Flughäfen und Bahnhöfe sind mögliche Anwendungsfälle; sehr komplexe Betreiber betreuen wir über Enterprise.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['vehicles', 'contracts', 'analytics', 'portal', 'hazards'],
  },
  hospital: {
    summary: 'Das Paket für Spitäler und Kliniken.',
    target: 'Spitäler, Kliniken und grössere Gesundheitseinrichtungen.',
    benefit:
      'Hohe Dokumentations- und Kontrolltiefe: Audits, Begehungen, Nachweise und Reinigungsplanung - ergänzt um Besucher und Gefahrstoffe.',
    whyThis:
      'Baut auf Care auf und ergänzt Besucher- und Gefahrstoff-Management - die Bereiche, die in Kliniken zusätzlich zum Pflege-Alltag dazukommen. Grössere Betreiber offerieren wir individuell.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['contracts', 'analytics', 'visitors', 'hazards'],
    priceFrom: true,
  },
  enterprise: {
    summary: 'Der freie Baukasten: Du wählst selbst, welche Module du brauchst.',
    target: 'Organisationen mit besonderen Anforderungen, die kein Standardpaket vollständig trifft.',
    benefit:
      'Statt ein festes Paket zu nehmen, stellst du aus allen verfügbaren Modulen deine eigene Lösung zusammen - Umfang und Preis werden individüll vereinbart.',
    whyThis:
      'Für Kunden, die weder das Komplettpaket noch ein Standardpaket brauchen: maximal flexibel, alles auswählbar, Angebot nach Auswahl.',
    groups: ['structure', 'technics', 'controls', 'cleaning', 'commerce'],
    extraModules: ['visitors', 'parking', 'waste', 'hazards'],
  },
};

/** Jahrespreis -> kaufmannisch gerundeter Monatspreis (CHF). */
export const monthlyPrice = (key: IndustryPackage): number | null => {
  const yearly = PACKAGE_PRICES[key as Exclude<IndustryPackage, ''>]?.yearly;
  return yearly ? Math.round(yearly / 12) : null;
};

export const yearlyPrice = (key: IndustryPackage): number | null =>
  PACKAGE_PRICES[key as Exclude<IndustryPackage, ''>]?.yearly ?? null;

/**
 * OFFENE ENTSCHEIDUNG: einmalige Einrichtungsgebuehr je Paket (CHF).
 * null = noch nicht festgelegt; die Seite zeigt dann «im Angebot ausgewiesen».
 * Stufung nach Aufwand: Professional < Property < Care/Institution <
 * Industry < Public; Enterprise immer individuell.
 */
export const SETUP_FEES: Record<Exclude<IndustryPackage, '' | 'custom'>, number | null> = {
  starter: null,
  professional: null,
  property: null,
  care: null,
  institution: null,
  industry: null,
  public: null,
  hospital: null,
  enterprise: null,
};

/** Was die Einrichtungspauschale enthaelt (Anzeige auf der Seite). */
export const SETUP_INCLUDED = [
  'Grundkonfiguration der Installation',
  'Einrichtung der Benutzer und Mandanten',
  'Persönliche Einführung in den Betrieb',
];

/** Separat offeriert, nicht Teil der Pauschale. */
export const SETUP_EXCLUDED = [
  'Übernahme bestehender Daten',
  'Umfangreiche Schulungen',
  'Individülle Konfiguration und Anbindungen',
];

/**
 * Monatspreise (CHF) je Zusatzmodul, gestaffelt nach Umfang:
 * kleine Verwaltungsmodule 29, Kontrollen und mittlere Module 49,
 * Reinigung und Geschaeftliches 79, Portal 99.
 */
export const ADDON_PRICES: Partial<Record<ModuleKey, number>> = {
  // Kleine Verwaltungsmodule
  organizations: 29,
  hazards: 29,
  sites: 29,
  suppliers: 29,
  sources: 29,
  keys: 29,
  inventory: 29,
  tools: 29,
  stock: 29,
  visitors: 29,
  parking: 29,
  workTimes: 29,
  // Kontrollen, Nachweise und mittlere Module
  energy: 49,
  solarplants: 49,
  solaryields: 49,
  vehicles: 49,
  legionella: 49,
  rcd: 49,
  inspections: 49,
  playgroundchecks: 49,
  firechecks: 49,
  audit: 49,
  walkthrough: 49,
  handover: 49,
  // Reinigung (gesamter Reinigungsbereich pro Modul)
  cleaning: 79,
  cleaningtasks: 79,
  cleaningplans: 79,
  cleaningareas: 79,
  cleaners: 79,
  cleaningchecks: 79,
  cleaningcomplaints: 79,
  // Kaufmaennisches und Auswertung
  contracts: 79,
  quotes: 79,
  invoices: 79,
  analytics: 79,
  // Kundenportal
  portal: 99,
};

/** Diese Module werden nicht als kostenpflichtige Zusatzmodule angeboten. */
const NO_ADDON: ModuleKey[] = ['waste'];

/**
 * Module, die NICHT im gewaehlten Paket sind = zubuchbare Zusatzmodule.
 * Enterprise ist ein Baukasten: dort stehen alle abschaltbaren Module zur Auswahl.
 */
export const addonModulesOf = (key: IndustryPackage): ModuleKey[] =>
  key === 'enterprise'
    ? OPTIONAL_MODULES.filter((module) => !NO_ADDON.includes(module))
    : key === '' || key === 'custom'
      ? []
      : disabledByPackage(key).filter((module) => !NO_ADDON.includes(module));

/** Enthaltene optionale Module, als Gruppenliste fuer die Anzeige. */
export const includedGroupsOf = (key: IndustryPackage): ModuleGroup[] => {
  if (key === '' || key === 'custom') return Object.values(MODULE_GROUPS);
  const info = PACKAGE_INFO[key as Exclude<IndustryPackage, '' | 'custom'>];
  return info?.groups.map((group) => MODULE_GROUPS[group]) ?? [];
};

/** Gesamtkosten Jahr 1: Abo-Jahrespreis + Einrichtung (soweit festgelegt). */
export const firstYearTotal = (key: IndustryPackage): number | null => {
  const yearly = yearlyPrice(key);
  if (yearly === null) return null;
  const setup = SETUP_FEES[key as Exclude<IndustryPackage, '' | 'custom'>] ?? 0;
  return yearly + setup;
};

export { OPTIONAL_MODULES };
