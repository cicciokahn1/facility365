/**
 * Verzeichnis der Schnittstellen.
 *
 * Alles, was heute ohne fremden Dienst funktioniert, ist «verfuegbar». Die
 * uebrigen Anbindungen sind vorbereitet: Bezeichnung, Zweck und Anschlussstelle
 * stehen fest, die Anmeldung bleibt bis zur Freigabe die bestehende.
 */
import { TranslationKey } from '@/lib/i18n/dictionary';

export type IntegrationStatus = 'available' | 'prepared';

export interface IntegrationDef {
  key: string;
  labelKey: TranslationKey;
  textKey: TranslationKey;
  status: IntegrationStatus;
}

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: 'excel',
    labelKey: 'integration.excel',
    textKey: 'integration.excelText',
    status: 'available',
  },
  {
    key: 'outlook',
    labelKey: 'integration.outlook',
    textKey: 'integration.outlookText',
    status: 'available',
  },
  {
    key: 'entra',
    labelKey: 'integration.entra',
    textKey: 'integration.entraText',
    status: 'prepared',
  },
  {
    key: 'sharepoint',
    labelKey: 'integration.sharepoint',
    textKey: 'integration.sharepointText',
    status: 'prepared',
  },
  {
    key: 'onedrive',
    labelKey: 'integration.onedrive',
    textKey: 'integration.onedriveText',
    status: 'prepared',
  },
  {
    key: 'api',
    labelKey: 'integration.api',
    textKey: 'integration.apiText',
    status: 'prepared',
  },
];
