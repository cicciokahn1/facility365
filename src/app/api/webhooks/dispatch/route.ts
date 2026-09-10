/**
 * Ereignisse an hinterlegte Webhook-Adressen weiterreichen.
 *
 * Die Adressen und das Geheimnis stehen ausschliesslich in den
 * Serverumgebungsvariablen, damit sie nicht im Browser landen:
 *
 *   FACILITY365_WEBHOOK_URLS   - Adressen, mit Komma getrennt
 *   FACILITY365_WEBHOOK_SECRET - Geheimnis fuer die Signatur (optional)
 *
 * Ohne hinterlegte Adresse antwortet die Route mit 503; der Browser stellt
 * das Senden dann fuer die Sitzung ein.
 */
import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 5000;

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

const targets = (): string[] =>
  (process.env.FACILITY365_WEBHOOK_URLS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('https://') || entry.startsWith('http://'));

export async function POST(request: Request) {
  const urls = targets();
  if (urls.length === 0) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const record = payload as Record<string, unknown>;
  if (!asText(record.event) || !asText(record.module)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const body = JSON.stringify(record);
  const secret = process.env.FACILITY365_WEBHOOK_SECRET ?? '';
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-facility365-event': asText(record.event),
  };
  if (secret) {
    headers['x-facility365-signature'] = `sha256=${createHmac('sha256', secret)
      .update(body)
      .digest('hex')}`;
  }

  const results = await Promise.all(
    urls.map((url) =>
      fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
        .then((response) => response.ok)
        .catch(() => false),
    ),
  );

  return NextResponse.json({
    delivered: results.filter(Boolean).length,
    failed: results.filter((ok) => !ok).length,
  });
}
