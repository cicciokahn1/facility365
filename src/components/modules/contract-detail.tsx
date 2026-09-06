'use client';

/** Vertrag; zeigt im Kopf den Erinnerungstermin vor Ablauf. */
import { BellRing } from 'lucide-react';

import { EntityDetail } from '@/components/module/entity-detail';
import { isReminderDue, reminderDate } from '@/lib/contracts/reminder';
import { useT } from '@/lib/i18n/provider';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, today } from '@/lib/utils/format';

export function ContractDetail({ id }: { id: string }) {
  const t = useT();
  const { settings } = useSettings();

  return (
    <EntityDetail
      collection="contracts"
      id={id}
      headerExtra={(contract) =>
        isReminderDue(contract, today()) ? (
          <span
            className="flex items-center gap-1.5 rounded-md bg-warning/15 px-2.5 py-1.5 text-sm font-medium text-warning-foreground"
            data-testid="contract-reminder-badge"
          >
            <BellRing className="size-4" aria-hidden />
            {t('contracts.reminderTitle')} · {t('contracts.noticeUntil')}:{' '}
            {formatDate(reminderDate(contract), settings.language)}
          </span>
        ) : null
      }
    />
  );
}
