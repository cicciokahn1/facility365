/**
 * Zugriff auf Felder eines Datensatzes ueber ihren Namen.
 *
 * Die Module beschreiben ihre Felder als Namen; hier werden sie einmal zentral
 * auf Werte abgebildet, damit die Oberflaeche ohne verstreute Umwandlungen
 * auskommt.
 */
import { FormValues } from '@/lib/schema';
import { BaseEntity } from '@/lib/types';

export const valuesOf = (entity: BaseEntity): FormValues => ({
  ...(entity as unknown as FormValues),
});

export const fieldValue = (entity: BaseEntity, name: string): unknown =>
  (entity as unknown as Record<string, unknown>)[name];

export const stringField = (entity: BaseEntity, name: string): string => {
  const value = fieldValue(entity, name);
  return typeof value === 'string' ? value : '';
};
