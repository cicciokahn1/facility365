/**
 * Termine eines Reinigungsplans.
 *
 * Aus Intervall und naechstem Termin entstehen die Folgetermine. Taegliche
 * und woechentliche Plaene erzeugen viele Termine; deshalb begrenzt eine
 * Hoechstzahl die Vorausberechnung.
 */
import { CleaningInterval } from '@/lib/types';

/** Abstand in Tagen; monatliche Intervalle rechnen ueber Monate. */
const INTERVAL_DAYS: Record<CleaningInterval, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 0,
  quarterly: 0,
  custom: 0,
};

const INTERVAL_MONTHS: Record<CleaningInterval, number> = {
  daily: 0,
  weekly: 0,
  biweekly: 0,
  monthly: 1,
  quarterly: 3,
  custom: 0,
};

export interface CleaningSchedule {
  interval: CleaningInterval;
  intervalDays?: number;
}

const addDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
};

const addMonths = (date: string, months: number): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  const day = parsed.getDate();
  parsed.setDate(1);
  parsed.setMonth(parsed.getMonth() + months);
  const lastDay = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0).getDate();
  parsed.setDate(Math.min(day, lastDay));
  return parsed.toISOString().slice(0, 10);
};

/** Naechster Termin nach einem Datum; leer, wenn kein Abstand bestimmbar ist. */
export const nextCleaningDate = (date: string, schedule: CleaningSchedule): string => {
  if (!date) return '';
  const months = INTERVAL_MONTHS[schedule.interval];
  if (months > 0) return addMonths(date, months);
  const days =
    schedule.interval === 'custom'
      ? Math.max(1, Math.round(schedule.intervalDays ?? 0) || 0)
      : INTERVAL_DAYS[schedule.interval];
  if (!days) return '';
  return addDays(date, days);
};

/** Termine ab dem naechsten Termin bis zu einem Stichtag, hoechstens `limit`. */
export const cleaningDates = (
  start: string,
  schedule: CleaningSchedule,
  until: string,
  limit = 40,
): string[] => {
  const dates: string[] = [];
  let date = start;
  while (date && date <= until && dates.length < limit) {
    dates.push(date);
    const next = nextCleaningDate(date, schedule);
    if (!next || next === date) break;
    date = next;
  }
  return dates;
};
