/**
 * Ablauf von Dokumenten.
 *
 * Ein Dokument gilt als ablaufend, sobald das Gueltigkeitsdatum innerhalb der
 * naechsten Frist liegt, und als abgelaufen, sobald es verstrichen ist.
 */

/** Vorlaufzeit der Erinnerung in Tagen. */
export const DOCUMENT_EXPIRY_DAYS = 30;

export type DocumentExpiryState = 'valid' | 'expiring' | 'expired';

const shiftDays = (date: string, days: number): string => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export const documentExpiryState = (validUntil: string, today: string): DocumentExpiryState => {
  if (!validUntil) return 'valid';
  if (validUntil < today) return 'expired';
  return validUntil <= shiftDays(today, DOCUMENT_EXPIRY_DAYS) ? 'expiring' : 'valid';
};
