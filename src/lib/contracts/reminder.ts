/**
 * Erinnerung vor Vertragsablauf.
 *
 * Erinnert wird, bevor die Kuendigungsfrist verstreicht: Vertragsende minus
 * Kuendigungsfrist. Ohne Frist ist das Vertragsende selbst der Termin.
 */
import { ContractEntity } from '@/lib/types';

/** Datum um Monate verschieben; kuerzere Monate rutschen auf den letzten Tag. */
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

/** Tag, an dem an den Vertrag erinnert wird; leer ohne Vertragsende. */
export const reminderDate = (contract: ContractEntity): string => {
  if (!contract.end) return '';
  const months = Number(contract.noticeMonths);
  if (!Number.isFinite(months) || months <= 0) return contract.end;
  return addMonths(contract.end, -months);
};

/** Wahr, solange der Vertrag laeuft und ein Termin bevorsteht. */
export const isContractOpen = (contract: ContractEntity): boolean =>
  contract.status === 'active' && Boolean(contract.end);

/** Wahr, sobald die Erinnerung faellig ist und der Vertrag noch laeuft. */
export const isReminderDue = (contract: ContractEntity, today: string): boolean => {
  if (!isContractOpen(contract)) return false;
  const date = reminderDate(contract);
  return Boolean(date) && date <= today && contract.end >= today;
};
