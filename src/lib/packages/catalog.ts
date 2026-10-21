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
  'professional',
  'property',
  'care',
  'institution',
  'industry',
  'public',
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
    description: 'Organisationen, Standorte, Lieferanten und Bezugsquellen verwalten.',
    modules: ['organizations', 'sites', 'suppliers', 'sources'],
  },
  technics: {
    title: 'Technik und Material',
    description: 'Energie, Solaranlagen, Schluessel, Inventar, Werkzeuge und Lager.',
    modules: ['energy', 'solarplants', 'solaryields', 'keys', 'inventory', 'tools', 'stock'],
  },
  controls: {
    title: 'Kontrollen und Nachweise',
    description:
      'Legionella, Elektro (NIV/RCD), Inspektionen, Spielplatz- und Brandchecks, Audits, Begehungen und Uebergaben.',
    modules: ['legionella', 'rcd', 'inspections', 'playgroundchecks', 'firechecks', 'audit', 'walkthrough', 'handover'],
  },
  cleaning: {
    title: 'Reinigung',
    description:
      'Reinigungsplaene, Flaechen, Mitarbeitende, Aufgaben, Qualitaetskontrollen und Reklamationen.',
    modules: ['cleaning', 'cleaningtasks', 'cleaningplans', 'cleaningareas', 'cleaners', 'cleaningchecks', 'cleaningcomplaints'],
  },
  commerce: {
    title: 'Kaufmaennisch',
    description: 'Vertraege, Offerten, Rechnungen, Auswertungen und Kundenportal.',
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
}

export const PACKAGE_INFO: Record<Exclude<IndustryPackage, '' | 'custom'>, PackageInfo> = {
  professional: {
    summary: 'Das Komplettpaket fuer Facility-Management- und Hauswartbetriebe.',
    target: 'Hauswartfirmen und FM-Dienstleister, die mehrere Liegenschaften fuer Kunden betreuen.',
    benefit:
      'Alle Module in einem System: vom Auftrag ueber Wartung, Kontrollen und Reinigung bis zu Offerten und Rechnungen.',
    whyThis:
      'Das Komplettpaket: hoechste Stufe mit festem Preis - alles enthalten, nichts dazubuchen, keine Ueberraschungen.',
    groups: ['structure', 'technics', 'controls', 'cleaning', 'commerce'],
    extraModules: ['visitors', 'parking', 'waste', 'hazards'],
  },
  property: {
    summary: 'Das Paket fuer Immobilienverwaltungen und Bewirtschafter.',
    target: 'Verwaltungen, die Liegenschaften im eigenen oder fremden Auftrag bewirtschaften.',
    benefit:
      'Betreiberpflichten dokumentiert erfuellen: Kontrollen, Wartungen und Schaeden je Liegenschaft lueckenlos nachweisen - plus Vertraege, Offerten und Rechnungen.',
    whyThis:
      'Deckt Bewirtschaftung und kaufmaennische Arbeit ab, ohne den Reinigungsbetrieb, den eine Verwaltung selten selbst fuehrt.',
    groups: ['structure', 'technics', 'controls', 'commerce'],
    extraModules: ['vehicles'],
  },
  care: {
    summary: 'Das Paket fuer Pflege- und Betreuungseinrichtungen.',
    target: 'Alters- und Pflegeheime, Spitaeler, Kliniken und betreute Wohnformen.',
    benefit:
      'Hygiene im Griff: Reinigungsplaene und -kontrollen, Legionella- und Sicherheitsnachweise sowie einwandfreie Dokumentation fuer Audits.',
    whyThis:
      'Einzige Stufe mit vollem Reinigungsbereich plus kompletten Kontrollen - die Nachweispflichten im Pflegealltag sind damit abgedeckt.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['contracts', 'analytics'],
  },
  institution: {
    summary: 'Das Paket fuer soziale Institutionen und Wohnheime.',
    target: 'Wohnheime, Werkstaetten, Tagesstaetten und gemeinnuetzige Traegerschaften.',
    benefit:
      'Betrieb, Technik und Reinigung in einem Werkzeug: Auftraege verteilen, Kontrollen fuehren und Reinigungsqualitaet sichern - auch mit wechselnden Teams.',
    whyThis:
      'Wie Care, aber auf institutionellen Wohn- und Arbeitsbetrieb zugeschnitten; dieselben Nachweis- und Reinigungsmodule ohne Pflegefokus.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['contracts', 'analytics'],
  },
  industry: {
    summary: 'Das Paket fuer Industrie- und Produktionsbetriebe.',
    target: 'Industrieunternehmen mit eigenem Unterhalts- und Facility-Team.',
    benefit:
      'Fuhrpark, Werkzeuge, Lager und Gefahrstoffe im Griff, dazu die gesetzlichen Kontrollen und das Kaufmaennische fuer externe Auftraege.',
    whyThis:
      'Vollausstattung fuer technische Betriebe - ohne Reinigungsbereich, den Industriebetriebe meist extern vergeben.',
    groups: ['structure', 'technics', 'controls', 'commerce'],
    extraModules: ['vehicles', 'hazards'],
  },
  public: {
    summary: 'Das Paket fuer Gemeinden und oeffentliche Verwaltungen.',
    target: 'Gemeinden, Staedte, Schulen und oeffentliche Betriebe.',
    benefit:
      'Vom Schulhaus bis zur Werkhalle: Kontrollen (Spielplatz, Brandschutz, Legionella), Reinigung, Auftraege und ein Meldeportal fuer die Bevoelkerung.',
    whyThis:
      'Die breiteste Stufe nach Professional: enthaelt Reinigung und das Buergermelde-Portal - die beiden Dinge, die eine Gemeinde braucht.',
    groups: ['structure', 'technics', 'controls', 'cleaning'],
    extraModules: ['vehicles', 'contracts', 'analytics', 'portal'],
  },
  enterprise: {
    summary: 'Der freie Baukasten: Du waehlst selbst, welche Module du brauchst.',
    target: 'Organisationen mit besonderen Anforderungen, die kein Standardpaket vollstaendig trifft.',
    benefit:
      'Statt ein festes Paket zu nehmen, stellst du aus allen verfuegbaren Modulen deine eigene Loesung zusammen - Umfang und Preis werden individuell vereinbart.',
    whyThis:
      'Fuer Kunden, die weder das Komplettpaket noch ein Standardpaket brauchen: maximal flexibel, alles auswaehlbar, Angebot nach Auswahl.',
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
  professional: null,
  property: null,
  care: null,
  institution: null,
  industry: null,
  public: null,
  enterprise: null,
};

/** Was die Einrichtungspauschale enthaelt (Anzeige auf der Seite). */
export const SETUP_INCLUDED = [
  'Grundkonfiguration der Installation',
  'Einrichtung der Benutzer und Mandanten',
  'Persoenliche Einfuehrung in den Betrieb',
];

/** Separat offeriert, nicht Teil der Pauschale. */
export const SETUP_EXCLUDED = [
  'Uebernahme bestehender Daten',
  'Umfangreiche Schulungen',
  'Individuelle Konfiguration und Anbindungen',
];

/**
 * OFFENE ENTSCHEIDUNG: Monatspreis je zubuchbarem Zusatzmodul (CHF).
 * null = wird im Angebot individuell verrechnet.
 */
export const ADDON_PRICES: Partial<Record<ModuleKey, number>> = {};

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
