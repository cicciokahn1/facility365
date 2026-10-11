'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAccess } from '@/lib/auth/scope';
import { useT } from '@/lib/i18n/provider';

/** Schnellzugriff auf die Outlook-Mails in der Kopfzeile. */
export function MailButton() {
  const t = useT();
  const access = useAccess();
  if (!access.canRead('microsoft')) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      aria-label={t('module.microsoft')}
      title={t('module.microsoft')}
      data-testid="header-mail"
      asChild
    >
      <Link href="/microsoft">
        <Mail className="size-5" aria-hidden />
      </Link>
    </Button>
  );
}
