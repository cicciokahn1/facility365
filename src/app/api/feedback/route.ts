/**
 * Oeffentliches Kundenfeedback zu einem Rapport.
 *
 * GET  /api/feedback?r=<rapport-id>  - Nummer und Titel fuer das Formular.
 * POST /api/feedback                  - speichert Sterne und Kommentar am Rapport.
 *
 * Nur der Server-Schluessel schreibt; Besucher sehen ausschliesslich Nummer
 * und Titel des Rapports, keine Inhalte.
 */
import { NextResponse } from 'next/server';

const clean = (value: unknown, max = 2000): string =>
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

const fetchReport = async (
  url: string,
  serviceKey: string,
  reportId: string,
): Promise<EntityRow | null> => {
  const response = await fetch(
    `${url}/rest/v1/reports?id=eq.${encodeURIComponent(reportId)}&is=deleted_at.null&select=id,tenant_id,user_id,number,data&limit=1`,
    { headers: headers(serviceKey), signal: AbortSignal.timeout(10000) },
  ).catch(() => null);
  if (!response || !response.ok) return null;
  const rows = (await response.json()) as EntityRow[];
  return rows[0] ?? null;
};

export async function GET(request: Request) {
  const { url, serviceKey, ready } = keys();
  if (!ready) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const reportId = clean(new URL(request.url).searchParams.get('r'), 80);
  if (!reportId) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const report = await fetchReport(url, serviceKey, reportId);
  if (!report) return NextResponse.json({ error: 'unknown' }, { status: 404 });

  return NextResponse.json({
    number: report.number,
    title: String(report.data.title ?? ''),
    /** Bereits abgegebenes Feedback wird nicht nochmals ausgeliefert. */
    answered: typeof report.data.feedbackRating === 'number',
  });
}

export async function POST(request: Request) {
  const { url, serviceKey, ready } = keys();
  if (!ready) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    r?: string;
    rating?: number;
    comment?: string;
  };
  const reportId = clean(body.r, 80);
  const rating = Math.round(Number(body.rating) || 0);
  const comment = clean(body.comment);
  if (!reportId || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const report = await fetchReport(url, serviceKey, reportId);
  if (!report) return NextResponse.json({ error: 'unknown' }, { status: 404 });
  if (typeof report.data.feedbackRating === 'number') {
    return NextResponse.json({ ok: true });
  }

  const data = {
    ...report.data,
    feedbackRating: rating,
    feedbackComment: comment,
    feedbackAt: new Date().toISOString(),
  };
  const response = await fetch(
    `${url}/rest/v1/reports?id=eq.${encodeURIComponent(report.id)}`,
    {
      method: 'PATCH',
      headers: headers(serviceKey),
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(10000),
    },
  ).catch(() => null);
  if (!response || !response.ok) {
    return NextResponse.json({ error: 'save_failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
