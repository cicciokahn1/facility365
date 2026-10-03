/**
 * KI-Fotoanalyse fuer die Schnellmeldung.
 *
 * Ein Foto des Schadens oder der Anlage wird an das Sprachmodell geschickt;
 * die Antwort fuellt Beschreibung, Kategorie und Prioritaet des Dialogs vor.
 * Laueft ueber den Server, damit der Schluessel nicht im Browser landet.
 */
import { NextResponse } from 'next/server';

const MODEL = 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_IMAGE_CHARS = 3_000_000;

interface ScanRequest {
  image?: unknown;
  language?: unknown;
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

interface ScanResult {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

const PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);

const parseResult = (text: string): ScanResult | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
    const priority = asText(parsed.priority);
    return {
      title: asText(parsed.title).slice(0, 120),
      description: asText(parsed.description).slice(0, 800),
      category: asText(parsed.category).slice(0, 60),
      priority: (PRIORITIES.has(priority) ? priority : 'medium') as ScanResult['priority'],
      suggestion: asText(parsed.suggestion).slice(0, 400),
    };
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'missing_key' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as ScanRequest;
  const image = typeof body.image === 'string' ? body.image : '';
  if (!image.startsWith('data:image/') || image.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ error: 'invalid_image' }, { status: 400 });
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: [
            'Du bist ein erfahrener Schweizer Hauswart und analysierst Fotos von Schäden und Anlagen.',
            'Antworte ausschliesslich mit einem JSON-Objekt, ohne erklärenden Text.',
            'Felder: "title" (kurzer Schadenstitel, max. 8 Wörter), "description" (sachlicher Befund in 1-2 Sätzen),',
            '"category" (einer aus: Wasser, Strom, Heizung, Lüftung, Gebäude, Aussenbereich, Sicherheit, Reinigung, Sonstiges),',
            '"priority" (einer aus: low, medium, high, critical - critical nur bei akuter Gefahr oder grossem Wasserschaden),',
            '"suggestion" (konkreter Handlungsvorschlag für den Hauswart in einem Satz).',
            'Erfinde nichts: was auf dem Bild nicht erkennbar ist, wird nicht behauptet.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analysiere dieses Foto für eine Schadensmeldung.' },
            { type: 'image_url', image_url: { url: image, detail: 'low' } },
          ],
        },
      ],
    }),
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ error: 'unreachable' }, { status: 502 });
  }

  const payload = (await response.json().catch(() => ({}))) as OpenAiResponse;
  if (!response.ok) {
    return NextResponse.json(
      { error: payload.error?.message ?? 'request_failed' },
      { status: response.status },
    );
  }

  const text = payload.choices?.[0]?.message?.content ?? '';
  const result = parseResult(text);
  if (!result || !result.description) {
    return NextResponse.json({ error: 'empty_answer' }, { status: 502 });
  }

  return NextResponse.json(result);
}
