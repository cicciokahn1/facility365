/** Kennungen und laufende Nummern. */

/** Zufaellige, stabile Kennung eines Datensatzes. */
export const newId = (prefix = 'id'): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

/**
 * Naechste laufende Nummer einer Sammlung.
 *
 * Die Nummer ist rein fachlich; die technische Kennung bleibt die id.
 */
export const nextNumber = (prefix: string, existing: string[], pad = 4): string => {
  const highest = existing.reduce((max, value) => {
    const match = /(\d+)$/.exec(value ?? '');
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(pad, '0')}`;
};
