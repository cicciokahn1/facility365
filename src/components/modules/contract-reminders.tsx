'use client';

/** Vertraege, deren Kuendigungsfrist laeuft oder die demnaechst enden. */
import Link from 'next/link';
import { BellRing } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isReminderDue, reminderDate } from '@/lib/contracts/reminder';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';

export function ContractReminders() {
  const t = useT();
  const { settings } = useSettings();
  const contracts = useCollectionItems('contracts');
  const due = contracts.filter((contract) => isReminderDue(contract, today()));

  if (due.length === 0) return null;

  return (
    <Card className="border-warning/40" data-testid="contract-reminders">
      <CardHeader className="flex flex-row items-center gap-2">
        <BellRing className="size-4 text-warning" aria-hidden />
        <CardTitle className="text-base text-warning-foreground">
          {t('contracts.reminderTitle')} ({due.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {due.map((contract) => (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
            data-testid="contract-reminder-item"
          >
            <span className="font-medium">
              {contract.title || contract.partner || contract.number}
            </span>
            <span className="text-muted-foreground">
              {t('contracts.end')}: {formatDate(contract.end, settings.language)} ·{' '}
              {t('contracts.noticeUntil')}: {formatDate(reminderDate(contract), settings.language)}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
