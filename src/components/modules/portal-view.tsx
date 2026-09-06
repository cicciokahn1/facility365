'use client';

/** Kundenportal: Kunde waehlen, freigegebene Daten sehen, Offerten entscheiden. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Plus, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { PortalQuoteRow, PortalRow, usePortalData } from '@/lib/portal/portal';
import { useSettings } from '@/lib/settings/provider';
import { formatDate, formatMoney } from '@/lib/utils/format';

const NONE = 'none';

interface SectionProps {
  titleKey: TranslationKey;
  testId: string;
  rows: PortalRow[];
  emptyKey: TranslationKey;
}

function Section({ titleKey, testId, rows, emptyKey }: SectionProps) {
  const t = useT();
  const { settings } = useSettings();

  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {t(titleKey)} <span className="text-muted-foreground">({rows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(emptyKey)}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {rows.map((row) => (
              <li key={row.id} className="py-2" data-testid="portal-row">
                <Link href={row.href} className="flex flex-col gap-0.5 hover:underline">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="text-muted-foreground">{row.number}</span>
                    {row.title}
                    <Badge variant="secondary">{t(row.statusKey)}</Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {[row.detail, formatDate(row.date, settings.language)]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function PortalView() {
  const t = useT();
  const { settings } = useSettings();
  const customers = useCollectionItems('customers');
  const quotesApi = useCollection('quotes');
  const [customerId, setCustomerId] = useState(NONE);

  const selected = customerId === NONE ? '' : customerId;
  const data = usePortalData(selected);

  const customerName = useMemo(() => {
    const customer = customers.find((item) => item.id === selected);
    return customer ? customer.name || customer.number : '';
  }, [customers, selected]);

  const decide = (quote: PortalQuoteRow, status: 'accepted' | 'rejected') => {
    quotesApi.update(
      quote.id,
      { status },
      status === 'accepted' ? 'history.quoteAccepted' : 'history.quoteRejected',
      customerName || t('module.portal'),
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="portal-view">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('module.portal')}</CardTitle>
          <Button asChild variant="outline" data-testid="portal-report-damage">
            <Link href="/damages?new=1">
              <Plus className="size-4" aria-hidden />
              {t('portal.reportDamage')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('portal.hint')}</p>
          <div className="flex flex-col gap-1.5 sm:max-w-sm">
            <Label>{t('module.customers.singular')}</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger data-testid="portal-customer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t('portal.chooseCustomer')}</SelectItem>
                {customers.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name || item.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!selected ? (
            <p className="text-sm text-muted-foreground" data-testid="portal-no-customer">
              {t('portal.chooseCustomer')}
            </p>
          ) : null}
          {selected && data.empty ? (
            <p className="text-sm text-muted-foreground" data-testid="portal-empty">
              {t('portal.empty')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {selected ? (
        <>
          <Card data-testid="portal-quotes">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t('module.quotes')}{' '}
                <span className="text-muted-foreground">({data.quotes.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.quotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('portal.noQuotes')}</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {data.quotes.map((quote) => (
                    <li
                      key={quote.id}
                      className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
                      data-testid="portal-quote"
                    >
                      <Link href={quote.href} className="flex flex-col gap-0.5 hover:underline">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          <span className="text-muted-foreground">{quote.number}</span>
                          {quote.title}
                          <Badge variant="secondary" data-testid="portal-quote-status">
                            {t(quote.statusKey)}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {[
                            quote.detail,
                            formatDate(quote.date, settings.language),
                            formatMoney(quote.total, quote.currency),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </Link>
                      {quote.decidable ? (
                        <span className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => decide(quote, 'accepted')}
                            data-testid="portal-accept"
                          >
                            <Check className="size-4" aria-hidden />
                            {t('portal.accept')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decide(quote, 'rejected')}
                            data-testid="portal-reject"
                          >
                            <X className="size-4" aria-hidden />
                            {t('portal.reject')}
                          </Button>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Section
            titleKey="module.orders"
            testId="portal-orders"
            rows={data.orders}
            emptyKey="portal.noOrders"
          />
          <Section
            titleKey="module.reports"
            testId="portal-reports"
            rows={data.reports}
            emptyKey="portal.noReports"
          />
          <Section
            titleKey="module.documents"
            testId="portal-documents"
            rows={data.documents}
            emptyKey="portal.noDocuments"
          />
        </>
      ) : null}
    </div>
  );
}
