/**
 * Bewertung einer Legionellenkontrolle.
 *
 * Die Grenzwerte stehen in den Einstellungen und sind damit anpassbar:
 * Mindesttemperatur Warmwasser, Hoechsttemperatur Kaltwasser sowie Warn- und
 * Grenzwert der Legionellenzahl in KBE je Liter.
 */
import { AppSettings, LegionellaResult, LegionellaSample, MaintenanceInterval } from '@/lib/types';

/** Monate je Intervall. */
export const INTERVAL_MONTHS: Record<MaintenanceInterval, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
  biennial: 24,
};

export interface LegionellaLimits {
  hotMin: number;
  coldMax: number;
  warnCfu: number;
  limitCfu: number;
  intervalMonths: number;
}

export const limitsOf = (settings: AppSettings): LegionellaLimits => ({
  hotMin: settings.legionellaHotMin,
  coldMax: settings.legionellaColdMax,
  warnCfu: settings.legionellaWarnCfu,
  limitCfu: settings.legionellaLimitCfu,
  intervalMonths: settings.legionellaIntervalMonths,
});

/** Strengste Bewertung gewinnt. */
const worst = (a: LegionellaResult, b: LegionellaResult): LegionellaResult => {
  const rank: Record<LegionellaResult, number> = { pending: 0, ok: 1, warning: 2, critical: 3 };
  return rank[a] >= rank[b] ? a : b;
};

/** Bewertung einzelner Messwerte gegen die Grenzwerte. */
export const evaluateValues = (
  values: { hotTemp?: number; coldTemp?: number; cfu?: number },
  limits: LegionellaLimits,
): LegionellaResult => {
  let result: LegionellaResult = 'pending';
  if (typeof values.cfu === 'number') {
    if (values.cfu >= limits.limitCfu) result = worst(result, 'critical');
    else if (values.cfu >= limits.warnCfu) result = worst(result, 'warning');
    else result = worst(result, 'ok');
  }
  if (typeof values.hotTemp === 'number') {
    if (values.hotTemp < limits.hotMin - 5) result = worst(result, 'critical');
    else if (values.hotTemp < limits.hotMin) result = worst(result, 'warning');
    else result = worst(result, 'ok');
  }
  if (typeof values.coldTemp === 'number') {
    if (values.coldTemp > limits.coldMax + 5) result = worst(result, 'critical');
    else if (values.coldTemp > limits.coldMax) result = worst(result, 'warning');
    else result = worst(result, 'ok');
  }
  return result;
};

/** Bewertung aller Messstellen einer Kontrolle. */
export const evaluateSamples = (
  samples: LegionellaSample[],
  limits: LegionellaLimits,
): LegionellaResult =>
  samples.reduce<LegionellaResult>(
    (current, sample) => worst(current, evaluateValues(sample, limits)),
    'pending',
  );

/** Naechster Kontrolltermin aus Datum und Intervall in Monaten. */
export const nextControlDate = (date: string, months: number): string => {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  const day = parsed.getDate();
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + months);
  const lastDay = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).getDate();
  parsed.setDate(Math.min(day, lastDay));
  return parsed.toISOString().slice(0, 10);
};
