/**
 * Rapporttext aus Stichworten.
 *
 * Der Aufruf des Sprachmodells laeuft ueber den Server, damit der Schluessel
 * nicht in den Browser gelangt. Die Antwort ist nur ein Vorschlag: gespeichert
 * wird er erst, wenn der Benutzer ihn uebernimmt.
 */
import { NextResponse } from 'next/server';

const MODEL = 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_KEYWORDS = 2000;

const LANGUAGE_NAMES: Record<string, string> = {
  de: 'Deutsch (Schweizer Schreibweise, «ss» statt «ß»)',
  fr: 'Französisch',
  it: 'Italienisch',
  en: 'Englisch',
};

interface AssistantRequest {
  keywords?: unknown;
  language?: unknown;
  context?: unknown;
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'missing_key' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as AssistantRequest;
  const keywords = asText(body.keywords).trim().slice(0, MAX_KEYWORDS);
  if (!keywords) {
    return NextResponse.json({ error: 'missing_keywords' }, { status: 400 });
  }

  const language = LANGUAGE_NAMES[asText(body.language)] ?? LANGUAGE_NAMES.de;
  const context = asText(body.context).trim().slice(0, MAX_KEYWORDS);

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: [
            `Du formulierst Arbeitsrapporte für ein Facility-Management-Unternehmen. Sprache: ${language}.`,
            'Aus knappen Stichworten entsteht ein sachlicher Rapporttext in ganzen Sätzen, in der Vergangenheitsform.',
            'Zwei bis fünf Sätze oder eine kurze Aufzählung der ausgeführten Arbeiten.',
            'Nur wiedergeben, was in den Stichworten steht: keine erfundenen Zeiten, Mengen, Preise oder Befunde.',
            'Keine Anrede, keine Unterschrift, keine Überschrift, keine Rückfragen.',
          ].join(' '),
        },
        {
          role: 'user',
          content: context ? `Stichworte: ${keywords}\n\nAngaben zum Rapport: ${context}` : `Stichworte: ${keywords}`,
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

  const text = payload.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    return NextResponse.json({ error: 'empty_answer' }, { status: 502 });
  }

  return NextResponse.json({ text });
}
