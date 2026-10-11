'use client';

/**
 * Zugeordnete Outlook-E-Mails eines Datensatzes.
 *
 * Jede Mail oeffnet sich mit einem Tipp direkt in Outlook; die Anhangnamen
 * stehen darunter, damit sie ohne Umweg gefunden werden.
 */
import { ExternalLink, Paperclip, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import type { MailLink } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

export function LinkedMails({
  mails,
  onRemove,
}: {
  mails?: MailLink[];
  onRemove?: (mail: MailLink) => void;
}) {
  const t = useT();
  const { settings } = useSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tab.mails')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!mails || mails.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('ms.noLinked')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mails.map((mail) => (
              <li
                key={mail.messageId}
                className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
              >
                <a
                  href={mail.webLink || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-sm font-medium">
                    {mail.subject || t('ms.noSubject')}
                    {mail.webLink ? (
                      <ExternalLink className="ml-1 inline size-3 text-muted-foreground" aria-hidden />
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      mail.fromName || mail.fromAddress,
                      formatDate(mail.receivedAt.slice(0, 10), settings.language),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {mail.attachments.length > 0 ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="size-3" aria-hidden />
                      {mail.attachments.join(', ')}
                    </p>
                  ) : null}
                </a>
                {onRemove ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t('action.delete')}
                    onClick={() => onRemove(mail)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
