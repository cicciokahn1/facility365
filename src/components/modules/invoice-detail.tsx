'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { LineItemEditor } from '@/components/module/line-item-editor';
import { LinkedMails } from '@/components/module/linked-mails';
import { InvoicePdfPanel } from '@/components/modules/invoice-pdf-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export function InvoiceDetail({ id }: { id: string }) {
  const t = useT();

  return (
    <EntityDetail
      collection="invoices"
      id={id}
      headerExtra={(invoice, update) => {
        const isPaid = invoice.status === 'paid';
        const isCancelled = invoice.status === 'cancelled';
        const inReview = invoice.status === 'inReview';
        const approved = invoice.status === 'approved';
        return (
          <div className="flex flex-wrap items-center gap-2">
            {inReview ? (
              <Badge variant="outline">{t('invoice.inReviewHint')}</Badge>
            ) : null}
            {approved ? (
              <Badge variant="secondary">{t('invoice.approvedHint')}</Badge>
            ) : null}
            {!isCancelled && !isPaid && (invoice.status === 'draft' || invoice.status === 'sent') ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => update({ status: 'inReview' }, 'invoice.sentForReview')}
                data-testid="invoice-send-review"
              >
                {t('invoice.sendForReview')}
              </Button>
            ) : null}
            {!isCancelled && !isPaid && inReview ? (
              <Button
                size="sm"
                onClick={() => update({ status: 'approved' }, 'invoice.approved')}
                data-testid="invoice-approve"
              >
                <CheckCircle2 className="size-4" aria-hidden />
                {t('invoice.approve')}
              </Button>
            ) : null}
            {isPaid ? (
              <Badge variant="secondary">
                {t('invoice.paidAt')}: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '–'}
              </Badge>
            ) : null}
            {!isCancelled ? (
              <Button
                size="sm"
                variant={isPaid ? 'outline' : 'default'}
                onClick={() =>
                  update(
                    isPaid
                      ? { status: 'sent', paidAt: '' }
                      : { status: 'paid', paidAt: new Date().toISOString() },
                    isPaid ? 'invoice.paymentReopened' : 'invoice.paymentRecorded',
                  )
                }
                data-testid="invoice-payment-toggle"
              >
                {isPaid ? (
                  <RotateCcw className="size-4" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                {isPaid ? t('invoice.reopenPayment') : t('invoice.markPaid')}
              </Button>
            ) : null}
          </div>
        );
      }}
      extraTabs={(invoice, update) => [
        {
          value: 'items',
          labelKey: 'tab.items',
          content: (
            <LineItemEditor
              items={invoice.items}
              currency={invoice.currency || 'CHF'}
              onChange={(items) => update({ items })}
            />
          ),
        },
        {
          value: 'pdf',
          labelKey: 'tab.pdf',
          content: <InvoicePdfPanel invoice={invoice} />,
        },
        {
          value: 'mails',
          labelKey: 'tab.mails',
          content: (
            <LinkedMails
              mails={invoice.mailLinks}
              onRemove={(mail) =>
                update({
                  mailLinks: (invoice.mailLinks ?? []).filter(
                    (item) => item.messageId !== mail.messageId,
                  ),
                })
              }
            />
          ),
        },
      ]}
    />
  );
}
