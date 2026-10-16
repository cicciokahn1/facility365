'use client';

/** Feedback-Link zum Kopieren sowie eingegangene Kundenbewertung zum Rapport. */
import { Copy, Star } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { Report } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

export function ReportFeedback({ report }: { report: Report }) {
  const t = useT();
  const { settings } = useSettings();
  const answered = typeof report.feedbackRating === 'number';

  const copyLink = async () => {
    const url = `${window.location.origin}/feedback?r=${encodeURIComponent(report.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('feedback.linkCopied'));
    } catch {
      window.prompt(t('feedback.copyManually'), url);
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid="report-feedback">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t('feedback.hint')}</p>
        <div>
          <Button variant="outline" onClick={() => void copyLink()} data-testid="feedback-copy">
            <Copy className="size-4" aria-hidden />
            {t('feedback.copyLink')}
          </Button>
        </div>
      </div>
      {answered ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-1" aria-label={`${report.feedbackRating} / 5`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`size-6 ${
                    value <= (report.feedbackRating ?? 0)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
              {report.feedbackAt ? (
                <span className="ml-2 text-sm text-muted-foreground">
                  {formatDate(report.feedbackAt, settings.language)}
                </span>
              ) : null}
            </div>
            {report.feedbackComment ? (
              <p className="text-sm">{report.feedbackComment}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('feedback.noComment')}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="feedback-empty">
          {t('feedback.none')}
        </p>
      )}
    </div>
  );
}
