/**
 * Oeffentliche Angebotsanfrage der Preisseite.
 *
 * POST /api/offer-request mit { name, company, email, package, modules, message }
 * Speichert die Anfrage in Supabase; der Leszugriff bleibt dem Service-Key
 * vorbehalten, Besucher duerfen nur eintragen.
 */
import { NextResponse } from 'next/server';

const FIELD_MAX = 500;
const LIST_MAX = 60;

const clean = (value: unknown, max = FIELD_MAX): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = clean(body?.name);
  const company = clean(body?.company);
  const email = clean(body?.email);
  if (!name || !company || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const modules = Array.isArray(body?.modules)
    ? body.modules.map((entry) => clean(entry, 80)).filter(Boolean).slice(0, LIST_MAX)
    : [];
  const row = {
    name,
    company,
    email,
    package: clean(body?.package, 80) || 'unbekannt',
    modules,
    message: clean(body?.message, 2000),
  };

  const response = await fetch(`${url}/rest/v1/offer_requests`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json({ error: 'request_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
