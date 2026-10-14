/**
 * Oeffentliche Mieter-Meldung.
 *
 * GET  /api/damage-report?p=<liegenschaft>  - Name und Gebaeude fuer das Formular.
 * POST /api/damage-report                    - legt den Schaden direkt im Modul an.
 *
 * Nur der Server-Schluessel schreibt; Besucher sehen ausschliesslich die
 * Liegenschaft, zu der der QR-Code gehoert. Geloeschte oder fremde
 * Datensaetze bleiben unerreichbar.
 */
import { NextResponse } from 'next/server';

const FIELD_MAX = 2000;

const clean = (value: unknown, max = FIELD_MAX): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const keys = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return { url, serviceKey, ready: Boolean(url && serviceKey) };
};

const headers = (serviceKey: string) => ({
  apikey: serviceKey,
  authorization: `Bearer ${serviceKey}`,
  'content-type': 'application/json',
});

interface EntityRow {
  id: string;
  tenant_id: string;
  user_id: string;
  number: string;
  data: Record<string, unknown>;
}

const fetchProperty = async (
  url: string,
  serviceKey: string,
  propertyId: string,
): Promise<EntityRow | null> => {
  const response = await fetch(
    `${url}/rest/v1/properties?id=eq.${encodeURIComponent(propertyId)}&is=deleted_at.null&select=id,tenant_id,user_id,number,data&limit=1`,
    { headers: headers(serviceKey), signal: AbortSignal.timeout(10000) },
  ).catch(() => null);
  if (!response || !response.ok) return null;
  const rows = (await response.json()) as EntityRow[];
  return rows[0] ?? null;
};

export async function GET(request: Request) {
  const { url, serviceKey, ready } = keys();
  if (!ready) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const propertyId = clean(new URL(request.url).searchParams.get('p'), 80);
  if (!propertyId) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const property = await fetchProperty(url, serviceKey, propertyId);
  if (!property) return NextResponse.json({ error: 'unknown' }, { status: 404 });

  const buildings = await fetch(
    `${url}/rest/v1/buildings?tenant_id=eq.${encodeURIComponent(property.tenant_id)}&data->>propertyId=eq.${encodeURIComponent(propertyId)}&is=deleted_at.null&select=id,data&limit=200`,
    { headers: headers(serviceKey), signal: AbortSignal.timeout(10000) },
  )
    .then((response) => (response.ok ? response.json() : []))
    .catch(() => [] as { id: string; data: { name?: string } }[]);

  const name = String(property.data.name ?? property.number);
  const address = property.data.address as { street?: string; city?: string } | undefined;
  return NextResponse.json({
    name,
    address: [address?.street, address?.city].filter(Boolean).join(', '),
    buildings: (buildings as { id: string; data: { name?: string } }[])
      .map((entry) => ({ id: entry.id, name: String(entry.data.name ?? '') }))
      .filter((entry) => entry.name),
  });
}

export async function POST(request: Request) {
  const { url, serviceKey, ready } = keys();
  if (!ready) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const propertyId = clean(body?.propertyId, 80);
  const title = clean(body?.title, 160);
  const description = clean(body?.description, 4000);
  const reporter = clean(body?.reporter, 160);
  const contact = clean(body?.contact, 160);
  const buildingId = clean(body?.buildingId, 80);
  if (!propertyId || !title || !description) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const property = await fetchProperty(url, serviceKey, propertyId);
  if (!property) return NextResponse.json({ error: 'unknown' }, { status: 404 });

  const existing = await fetch(
    `${url}/rest/v1/damages?tenant_id=eq.${encodeURIComponent(property.tenant_id)}&select=number&limit=10000`,
    { headers: headers(serviceKey), signal: AbortSignal.timeout(15000) },
  )
    .then((response) => (response.ok ? response.json() : []))
    .catch(() => [] as { number: string }[]);
  const highest = (existing as { number: string }[]).reduce((max, row) => {
    const match = /(\d+)$/.exec(row.number ?? '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  const now = new Date().toISOString();
  const damage = {
    id: `dam-${crypto.randomUUID()}`,
    number: `SCH-${String(highest + 1).padStart(4, '0')}`,
    createdAt: now,
    updatedAt: now,
    notes: '',
    photos: [],
    documents: [],
    history: [],
    title,
    description:
      `${description}\n\nGemeldet von: ${reporter || 'Mieter'}` +
      (contact ? ` (${contact})` : ''),
    status: 'reported',
    priority: 'medium',
    customerId: '',
    propertyId,
    buildingId,
    roomId: '',
    assetId: '',
    outdoorAreaId: '',
    reportedBy: reporter || 'Mieter',
    reportedById: '',
    assigneeUserId: '',
    assigneeTeam: '',
    reportedAt: now.slice(0, 10),
    fixedAt: '',
    insuranceCase: false,
  };

  const response = await fetch(`${url}/rest/v1/damages`, {
    method: 'POST',
    headers: { ...headers(serviceKey), prefer: 'return=minimal' },
    body: JSON.stringify({
      id: damage.id,
      user_id: property.user_id,
      tenant_id: property.tenant_id,
      number: damage.number,
      deleted_at: null,
      data: damage,
    }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json({ error: 'request_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
