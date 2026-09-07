/**
 * Kostenlose Testversion von Facility365.
 *
 * Eine Registrierung startet 30 Tage Testzeit. Die Testdaten liegen in einer
 * eigenen Umgebung: im Browserbetrieb unter einem eigenen Speicherbereich, mit
 * Anmeldung in einem eigenen Mandanten. Bestehende Installationen ohne
 * Testeintrag bleiben unveraendert und laufen ohne Frist weiter.
 */

/** Dauer der kostenlosen Testversion in Tagen. */
export const TRIAL_DAYS = 30;

/** Tage, an denen die Oberflaeche vor dem Ablauf warnt. */
export const TRIAL_WARN_DAYS = [7, 3];

/** Speicherbereich der Produktivdaten. */
export const LIVE_PREFIX = "facility365.v2.";

/** Speicherbereich der Testumgebung; strikt getrennt von den Produktivdaten. */
export const TRIAL_PREFIX = "facility365.demo.";

const TRIAL_KEY = "facility365.trial";

export type TrialPlan = "trial" | "licensed";

export interface TrialRecord {
  plan: TrialPlan;
  startedAt: string;
  endsAt: string;
}

export interface TrialState {
  /** Eine Testversion laeuft (oder ist abgelaufen). */
  isTrial: boolean;
  /** Zeitpunkt des Ablaufs als ISO-Datum. */
  endsAt: string;
  /** Verbleibende Tage; nie kleiner als null. */
  daysLeft: number;
  expired: boolean;
}

/** Kein Testeintrag: die Anwendung laeuft wie bisher ohne Frist. */
export const NO_TRIAL: TrialState = {
  isTrial: false,
  endsAt: "",
  daysLeft: 0,
  expired: false,
};

const dayInMs = 24 * 60 * 60 * 1000;

/** Der Speicherbereich wechselt hoechstens einmal je Sitzung. */
let cachedPrefix = "";

export const addDays = (from: Date, days: number): string =>
  new Date(from.getTime() + days * dayInMs).toISOString();

/** Verbleibende Tage, aufgerundet: der letzte angebrochene Tag zaehlt mit. */
export const daysUntil = (endsAt: string, now: Date = new Date()): number => {
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - now.getTime()) / dayInMs));
};

export const trialStateOf = (
  record: TrialRecord | null,
  now: Date = new Date(),
): TrialState => {
  if (!record || record.plan !== "trial") return NO_TRIAL;
  const daysLeft = daysUntil(record.endsAt, now);
  return {
    isTrial: true,
    endsAt: record.endsAt,
    daysLeft,
    expired: daysLeft <= 0,
  };
};

/** Testeintrag des Geraets; null, solange keine Testversion gestartet wurde. */
export const readTrial = (): TrialRecord | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TRIAL_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TrialRecord>;
    if (!value.endsAt || !value.startedAt) return null;
    return {
      plan: value.plan === "licensed" ? "licensed" : "trial",
      startedAt: value.startedAt,
      endsAt: value.endsAt,
    };
  } catch {
    return null;
  }
};

export const writeTrial = (record: TrialRecord): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRIAL_KEY, JSON.stringify(record));
  cachedPrefix = TRIAL_PREFIX;
};

/** Startet die Testzeit; ein bestehender Eintrag wird nicht ueberschrieben. */
export const startTrial = (now: Date = new Date()): TrialRecord => {
  const existing = readTrial();
  if (existing) return existing;
  const record: TrialRecord = {
    plan: "trial",
    startedAt: now.toISOString(),
    endsAt: addDays(now, TRIAL_DAYS),
  };
  writeTrial(record);
  return record;
};

/**
 * Verlaengert die Testzeit um weitere Tage.
 *
 * Abgelaufene Testversionen zaehlen ab dem heutigen Tag, laufende ab dem
 * bisherigen Ende - so geht keine verbleibende Zeit verloren.
 */
export const extendTrial = (
  days: number,
  now: Date = new Date(),
): TrialRecord | null => {
  const existing = readTrial();
  if (!existing) return null;
  const end = new Date(existing.endsAt);
  const base = Number.isNaN(end.getTime()) || end < now ? now : end;
  const record: TrialRecord = { ...existing, endsAt: addDays(base, days) };
  writeTrial(record);
  return record;
};

/**
 * Speicherbereich der aktuellen Umgebung.
 *
 * Sobald eine Testversion besteht, liegen alle Daten im Testbereich; die
 * bestehenden Produktivdaten bleiben unberuehrt daneben liegen.
 */
export const workspacePrefix = (): string => {
  if (typeof window === "undefined") return LIVE_PREFIX;
  if (!cachedPrefix) cachedPrefix = readTrial() ? TRIAL_PREFIX : LIVE_PREFIX;
  return cachedPrefix;
};
