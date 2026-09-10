/**
 * Ereignisse nach aussen melden (Webhooks).
 *
 * Die Anwendung meldet wichtige Vorgaenge an den Server, der sie signiert an
 * die hinterlegten Adressen weiterreicht. Ohne hinterlegte Adresse passiert
 * nichts: der erste Versuch antwortet mit 503, danach schweigt der Browser
 * fuer den Rest der Sitzung, damit im Betrieb keine Last entsteht.
 */
import { CollectionKey } from '@/lib/types';

/** Ereignisarten; die Namen bleiben stabil, damit Empfaenger darauf bauen koennen. */
export type WebhookEvent =
  | 'record.created'
  | 'record.updated'
  | 'record.completed'
  | 'record.deleted'
  | 'record.restored';

export interface WebhookPayload {
  event: WebhookEvent;
  /** Modul des Datensatzes, z. B. "tickets" oder "orders". */
  module: CollectionKey;
  recordId: string;
  recordNumber: string;
  recordTitle: string;
  /** Handelnde Person. */
  userId: string;
  userName: string;
  at: string;
  /** Geaenderte Felder beim Aendern. */
  changes?: { field: string; from: string; to: string }[];
}

/** Zuordnung der internen Verlaufseintraege zu den Ereignisnamen. */
const EVENT_OF_ACTION: Record<string, WebhookEvent> = {
  'history.created': 'record.created',
  'history.updated': 'record.updated',
  'history.completed': 'record.completed',
  'history.deleted': 'record.deleted',
  'history.restored': 'record.restored',
  'history.purged': 'record.deleted',
};

export const webhookEventOf = (action: string): WebhookEvent | null =>
  EVENT_OF_ACTION[action] ?? null;

/** Wahr, solange der Server Ereignisse annimmt. */
let enabled = true;

/** Meldung abschicken; Fehler bleiben ohne Wirkung auf die Bedienung. */
export function sendWebhookEvent(payload: WebhookPayload): void {
  if (!enabled || typeof window === 'undefined') return;
  void fetch('/api/webhooks/dispatch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then((response) => {
      if (response.status === 503) enabled = false;
    })
    .catch(() => {
      enabled = false;
    });
}
