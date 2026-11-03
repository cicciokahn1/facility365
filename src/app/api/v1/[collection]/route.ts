/**
 * Lese-Schnittstelle fuer Fremdsysteme.
 *
 * GET /api/v1/<modul>?tenant=<organisation>&limit=<anzahl>
 * Kopfzeile: x-api-key
 *
 * Vorausgesetzte Serverumgebungsvariablen:
 *   FACILITY365_API_KEY       - Schluessel, den der Aufrufer mitsenden muss
 *   SUPABASE_SERVICE_ROLE_KEY - Datenbankzugriff des Servers
 *
 * Die Organisation muss immer angegeben werden: die Schnittstelle liefert nie
 * Daten mehrerer Mandanten auf einmal. Geloeschtes (Papierkorb) bleibt aussen
 * vor, solange nicht ausdruecklich danach gefragt wird.
 */
import { NextResponse } from 'next/server';

import { COLLECTIONS } from '@/lib/data/collections';
import { disabledByPackage } from '@/lib/packages/packages';
import { CollectionKey, IndustryPackage, ModuleKey } from '@/lib/types';

/** Collections, die einem optionalen Modul entsprechen (Paketgrenze). */
const COLLECTION_MODULES = [
  'organizations', 'sites', 'suppliers', 'sources',
  'energy', 'solarplants', 'solaryields', 'keys', 'inventory', 'tools', 'stock',
  'legionella', 'rcd', 'inspections', 'playgroundchecks', 'firechecks',
  'cleaningareas', 'cleaners', 'cleaningplans', 'cleaningtasks',
  'cleaningchecks', 'cleaningcomplaints',
  'contracts', 'quotes', 'invoices',
  'vehicles', 'visitors', 'parking', 'waste', 'hazards',
];

const MAX_LIMIT = 500;

interface Row {
  id: string;
  number: string;
  deleted_at: string | null;
  data: Record<string, unknown>;
}

const isCollection = (value: string): value is CollectionKey =>
  (COLLECTIONS as string[]).includes(value);

export async function GET(
  request: Request,
  context: { params: Promise<{ collection: string }> },
) {
  const apiKey = process.env.FACILITY365_API_KEY ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!apiKey || !serviceKey || !url) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }
  if (request.headers.get('x-api-key') !== apiKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { collection } = await context.params;
  if (!isCollection(collection)) {
    return NextResponse.json({ error: 'unknown_collection' }, { status: 404 });
  }

  const query = new URL(request.url).searchParams;
  const tenant = query.get('tenant') ?? '';
  if (!tenant) {
    return NextResponse.json({ error: 'missing_tenant' }, { status: 400 });
  }
  const limit = Math.min(Number(query.get('limit')) || 100, MAX_LIMIT);
  const withDeleted = query.get('deleted') === '1';

  /**
   * Paketgrenze (serverseitig): die Schnittstelle laeuft mit dem
   * Service-Schluessel und umgeht RLS - deshalb wird das Paket des
   * Mandanten hier geprueft. billing_customers (Kauf) hat Vorrang vor
   * tenant_settings (freie Wahl/Testphase); ''/'custom' = kein Limit.
   */
  if ((COLLECTION_MODULES as string[]).includes(collection)) {
    const settingsUrl = new URL(`${url}/rest/v1/tenant_settings`);
    settingsUrl.searchParams.set('select', 'data');
    settingsUrl.searchParams.set('tenant_id', `eq.${tenant}`);
    const billingUrl = new URL(`${url}/rest/v1/billing_customers`);
    billingUrl.searchParams.set('select', 'package');
    billingUrl.searchParams.set('tenant_id', `eq.${tenant}`);
    billingUrl.searchParams.set('status', 'neq.canceled');
    const headers = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` };
    const [billingRes, settingsRes] = await Promise.all([
      fetch(billingUrl, { headers, signal: AbortSignal.timeout(8000) }).catch(() => null),
      fetch(settingsUrl, { headers, signal: AbortSignal.timeout(8000) }).catch(() => null),
    ]);
    const billingRows = (await billingRes?.json().catch(() => [])) as { package?: string }[];
    const settingsRows = (await settingsRes?.json().catch(() => [])) as {
      data?: { industryPackage?: string };
    }[];
    const pkg =
      billingRows?.[0]?.package ?? settingsRows?.[0]?.data?.industryPackage ?? '';
    if (
      pkg &&
      pkg !== 'custom' &&
      disabledByPackage(pkg as IndustryPackage).includes(collection as ModuleKey)
    ) {
      return NextResponse.json({ error: 'module_not_in_package' }, { status: 403 });
    }
  }

  const target = new URL(`${url}/rest/v1/${collection}`);
  target.searchParams.set('select', 'id,number,data,deleted_at');
  target.searchParams.set('tenant_id', `eq.${tenant}`);
  if (!withDeleted) target.searchParams.set('deleted_at', 'is.null');
  target.searchParams.set('limit', String(limit));
  target.searchParams.set('order', 'created_at.asc');

  const response = await fetch(target, {
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
    },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json({ error: 'request_failed' }, { status: 502 });
  }

  const rows = (await response.json().catch(() => [])) as Row[];
  return NextResponse.json({
    collection,
    count: rows.length,
    items: rows.map((row) => ({
      ...row.data,
      id: row.id,
      number: row.number,
      deletedAt: row.deleted_at ?? undefined,
    })),
  });
}
