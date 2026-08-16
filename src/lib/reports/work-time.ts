/**
 * Arbeitszeit aus Beginn, Ende und Pause.
 *
 * Bewusst ohne Zeitmessung: erfasst wird, was auf dem Rapport steht.
 */

export interface WorkTime {
  start: string;
  end: string;
  breakMinutes: number;
}

/** Minuten seit Mitternacht; null, wenn die Angabe keine Uhrzeit ist. */
const minutesOf = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/**
 * Gearbeitete Minuten.
 *
 * Ein Ende vor dem Beginn gilt als Einsatz ueber Mitternacht; eine Pause, die
 * laenger dauert als der Einsatz, ergibt null Minuten statt einer Gutschrift.
 */
export const workedMinutes = ({ start, end, breakMinutes }: WorkTime): number => {
  const from = minutesOf(start);
  const to = minutesOf(end);
  if (from === null || to === null) return 0;
  const span = to >= from ? to - from : to + 24 * 60 - from;
  return Math.max(0, span - Math.max(0, Math.round(breakMinutes || 0)));
};

/** Arbeitszeit als Dezimalstunden, auf zwei Stellen gerundet. */
export const workedHours = (time: WorkTime): number =>
  Math.round((workedMinutes(time) / 60) * 100) / 100;

/** Arbeitszeit als H:MM, z. B. 2:30. */
export const formatWorkTime = (time: WorkTime): string => {
  const minutes = workedMinutes(time);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};

/** Prueft, ob Beginn und Ende erfasst und lesbar sind. */
export const hasWorkTime = (time: WorkTime): boolean =>
  minutesOf(time.start) !== null && minutesOf(time.end) !== null;
