'use client';

/**
 * Oeffentliches Kundenfeedback zu einem Rapport.
 *
 * Der Link /feedback?r=<rapport-id> wird dem Kunden nach dem Rapport
 * mitgegeben - kein Login noetig. Bewertung landet direkt am Rapport.
 */
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Info {
  number: string;
  title: string;
  answered: boolean;
}

function FeedbackForm() {
  const params = useSearchParams();
  const reportId = params.get('r') ?? '';
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!reportId) return;
    void fetch(`/api/feedback?r=${encodeURIComponent(reportId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Info | null) => {
        if (data?.number) {
          setInfo(data);
          if (data.answered) setDone(true);
        } else {
          setError('Der Link ist ungültig oder der Rapport wurde entfernt.');
        }
      })
      .catch(() => setError('Verbindung fehlgeschlagen.'));
  }, [reportId]);

  const submit = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ r: reportId, rating, comment }),
      });
      if (!response.ok) {
        setError('Das Feedback konnte nicht gesendet werden. Bitte erneut versuchen.');
        return;
      }
      setDone(true);
    } catch {
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 p-6">
      <header className="flex flex-col gap-1">
        <p className="text-2xl font-bold">Facility365</p>
        <h1 className="text-xl font-semibold">Wie zufrieden waren Sie?</h1>
        {info ? (
          <p className="text-sm text-muted-foreground">
            Rapport {info.number}
            {info.title ? ` – ${info.title}` : ''}
          </p>
        ) : null}
      </header>
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
          <p className="text-lg font-semibold">Herzlichen Dank!</p>
          <p className="text-sm text-muted-foreground">
            Ihr Feedback ist bei uns eingegangen und hilft uns, besser zu werden.
          </p>
        </div>
      ) : !reportId ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Der Link ist ungültig.
        </p>
      ) : error && !info ? (
        <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{error}</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div
            className="flex items-center justify-center gap-2 py-2"
            role="radiogroup"
            aria-label="Bewertung 1 bis 5 Sterne"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} Sterne`}
                className="p-1 transition-transform hover:scale-110"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                onMouseLeave={() => setHover(0)}
                data-testid={`feedback-star-${value}`}
              >
                <Star
                  className={`size-10 ${
                    value <= (hover || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Kommentar (freiwillig)</span>
            <Textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Was hat gut funktioniert? Was können wir besser machen?"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy || rating === 0} data-testid="feedback-submit">
            {busy ? 'Senden…' : 'Feedback senden'}
          </Button>
        </form>
      )}
    </main>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackForm />
    </Suspense>
  );
}
