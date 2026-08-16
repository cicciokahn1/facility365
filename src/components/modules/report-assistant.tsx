'use client';

/**
 * KI-Rapport-Assistent.
 *
 * Aus Stichworten entsteht ein Vorschlag fuer den Rapporttext. Der Vorschlag
 * bleibt unverbindlich: erst „Übernehmen“ schreibt ihn in den Rapport,
 * „Abbrechen“ verwirft ihn. Ohne Zutun aendert der Assistent nichts.
 */
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Report } from '@/lib/types';

export function ReportAssistant({
  report,
  onChange,
}: {
  report: Report;
  onChange: (values: Partial<Report>, action?: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const [keywords, setKeywords] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!keywords.trim()) {
      toast.error(t('ai.missingKeywords'));
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/report-assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          keywords,
          language: settings.language,
          /** Titel und Tätigkeit helfen dem Modell, den Rapport einzuordnen. */
          context: [report.title, report.summary].filter(Boolean).join(' – '),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { text?: string; error?: string };

      if (!response.ok || !payload.text) {
        toast.error(
          payload.error === 'missing_key' ? t('ai.notConfigured') : t('ai.failed'),
          payload.error && payload.error !== 'missing_key' ? { description: payload.error } : undefined,
        );
        return;
      }

      setSuggestion(payload.text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-4" data-testid="report-assistant">
      <p className="text-sm text-muted-foreground">{t('ai.hint')}</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-keywords">{t('ai.keywords')}</Label>
        <Textarea
          id="ai-keywords"
          rows={3}
          value={keywords}
          placeholder={t('ai.placeholder')}
          onChange={(event) => setKeywords(event.target.value)}
          data-testid="ai-keywords"
        />
      </div>

      <Button
        className="h-11 self-start"
        onClick={() => void generate()}
        disabled={busy}
        data-testid="ai-generate"
      >
        <Sparkles className="size-4" aria-hidden />
        {busy ? t('ai.working') : t('ai.generate')}
      </Button>

      {suggestion ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3" data-testid="ai-suggestion">
          <p className="whitespace-pre-wrap text-sm">{suggestion}</p>
          <p className="text-xs text-muted-foreground">{t('ai.reviewHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-11"
              onClick={() => {
                onChange({ workDescription: suggestion }, 'history.updated');
                setSuggestion('');
                setKeywords('');
                toast.success(t('ai.applied'));
              }}
              data-testid="ai-apply"
            >
              {t('ai.apply')}
            </Button>
            <Button
              className="h-11"
              variant="outline"
              onClick={() => setSuggestion('')}
              data-testid="ai-discard"
            >
              <X className="size-4" aria-hidden />
              {t('ai.discard')}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
