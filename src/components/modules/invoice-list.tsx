'use client';

/**
 * Rechnungsuebersicht.
 *
 * Fuehlt sich wie ein eigenes Rechnungssystem an: Jahr und Monat waehlen,
 * nach Status, Objekt, Lieferant und Kategorie filtern, sortieren, suchen -
 * und offene oder ueberfaellige Betraege stehen immer oben.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/common/status-badge';
import { EntityForm } from '@/components/module/entity-form';
import { lineItemTotals } from '@/components/module/line-item-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccess } from '@/lib/auth/scope';
import { indexOf, useCollection, useCollectionItems } from '@/lib/data/store';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { referenceFor } from '@/lib/invoices/swiss-qr';
import { configOf, defaultValuesOf } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import { FormValues } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '@/lib/utils/format';

const ALL = '__all';
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const config = configOf('invoices');
const moduleDef = moduleByCollection('invoices');

/** Eine versandte Rechnung gilt nach der Faelligkeit als ueberfaellig. */
const effectiveStatus = (invoice: Invoice, today: string): InvoiceStatus =>
  invoice.status === 'sent' && invoice.dueDate && invoice.dueDate < today
    ? 'overdue'
    : invoice.status;

const STATUS_LABEL: Record<InvoiceStatus, TranslationKey> = {
  draft: 'status.draft',
  sent: 'status.open',
  paid: 'status.paid',
  overdue: 'status.overdue',
  cancelled: 'status.cancelled',
};

const gross = (invoice: Invoice) => lineItemTotals(invoice.items).gross;

export function InvoiceList() {
  const t = useT();
  const router = useRouter();
  const access = useAccess();
  const { settings } = useSettings();
  const mayWrite = access.canWrite('invoices');
  const { items, create, update } = useCollection('invoices');
  const suppliers = useCollectionItems('suppliers');
  const properties = useCollectionItems('properties');
  const supplierIndex = useMemo(() => indexOf(suppliers), [suppliers]);
  const propertyIndex = useMemo(() => indexOf(properties), [properties]);

  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [propertyId, setPropertyId] = useState(ALL);
  const [supplierId, setSupplierId] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [sort, setSort] = useState('date');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const invoices = useMemo(
    () => items as unknown as Invoice[],
    [items],
  );

  const years = useMemo(() => {
    const found = new Set(
      invoices.map((invoice) => invoice.date.slice(0, 4)).filter(Boolean),
    );
    found.add(currentYear);
    return [...found].sort().reverse();
  }, [currentYear, invoices]);

  const yearItems = useMemo(
    () => invoices.filter((invoice) => invoice.date.startsWith(year)),
    [invoices, year],
  );

  const openItems = yearItems.filter((invoice) =>
    ['sent', 'overdue'].includes(effectiveStatus(invoice, today)),
  );
  const openTotal = openItems.reduce((sum, invoice) => sum + gross(invoice), 0);
  const yearTotal = yearItems.reduce(
    (sum, invoice) =>
      invoice.status === 'cancelled' ? sum : sum + gross(invoice),
    0,
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = yearItems.filter((invoice) => {
      if (month !== ALL && invoice.date.slice(5, 7) !== month.padStart(2, '0'))
        return false;
      if (status !== ALL && effectiveStatus(invoice, today) !== status)
        return false;
      if (propertyId !== ALL && invoice.propertyId !== propertyId) return false;
      if (supplierId !== ALL && invoice.supplierId !== supplierId) return false;
      if (category !== ALL && invoice.category !== category) return false;
      if (term) {
        const haystack = [
          invoice.number,
          invoice.title,
          invoice.notes,
          supplierIndex.get(invoice.supplierId)?.name,
          propertyIndex.get(invoice.propertyId)?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
    const nameOf = (id: string) => supplierIndex.get(id)?.name ?? '';
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'due':
          return a.dueDate.localeCompare(b.dueDate);
        case 'amount':
          return gross(b) - gross(a);
        case 'supplier':
          return nameOf(a.supplierId).localeCompare(nameOf(b.supplierId));
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [
    category,
    month,
    propertyId,
    propertyIndex,
    search,
    sort,
    status,
    supplierId,
    supplierIndex,
    today,
    yearItems,
  ]);

  const createInvoice = (formValues: FormValues) => {
    const { amount, ...values } = formValues;
    const price = Number(amount) || 0;
    const items =
      price > 0
        ? [
            {
              id: crypto.randomUUID(),
              position: 1,
              description: String(values.title || ''),
              quantity: 1,
              unit: '',
              unitPrice: price,
              vatRate: 8.1,
            },
          ]
        : [];
    const payment = {
      recipient: settings.companyName,
      address: settings.companyAddress,
      iban: settings.paymentIban,
      qrIban: settings.paymentQrIban,
      bank: settings.paymentBank,
      bic: settings.paymentBic,
      referenceType: settings.paymentReferenceType,
    };
    const entity = create(
      { ...values, items, payment, qrReference: '' } as never,
      settings.profileName || settings.companyName,
    );
    update(entity.id, {
      payment,
      qrReference: referenceFor(entity.number, payment),
    } as never);
    toast.success(t('toast.created'));
    router.push(`/invoices/${entity.id}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-primary">
          {t('module.invoices')}
        </h1>
        {mayWrite ? (
          <Button size="lg" onClick={() => setFormOpen(true)} data-testid="invoice-new">
            <Plus className="size-4" aria-hidden />
            {t('action.new')}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-warning/60 bg-warning/10">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-warning-foreground">
              {t('invoice.openDue')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatMoney(openTotal, settings.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {openItems.length} {t('invoice.count')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">{t('invoice.yearTotal')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatMoney(yearTotal, settings.currency)}
            </p>
            <p className="text-xs text-muted-foreground">{year}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">{t('invoice.count')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{yearItems.length}</p>
            <p className="text-xs text-muted-foreground">{year}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger aria-label={t('invoice.year')}>
            <SelectValue placeholder={t('invoice.year')} />
          </SelectTrigger>
          <SelectContent>
            {years.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger aria-label={t('invoice.month')}>
            <SelectValue placeholder={t('invoice.month')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('invoice.allMonths')}</SelectItem>
            {MONTHS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {String(value).padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label={t('common.status')}>
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
            {(config.statusOptions ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(STATUS_LABEL[option.value as InvoiceStatus] ?? option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger aria-label={t('module.properties.singular')}>
            <SelectValue placeholder={t('module.properties.singular')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger aria-label={t('module.suppliers.singular')}>
            <SelectValue placeholder={t('module.suppliers.singular')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label={t('common.category')}>
            <SelectValue placeholder={t('common.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
            {[
              'invoice.category.service',
              'invoice.category.material',
              'invoice.category.external',
              'invoice.category.other',
            ].map((key) => (
              <SelectItem key={key} value={key.split('.').pop() ?? key}>
                {t(key as TranslationKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('list.searchPlaceholder')}
          className="max-w-sm"
          data-testid="invoice-search"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48" aria-label={t('list.sort')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('invoice.sort.date')}</SelectItem>
            <SelectItem value="due">{t('invoice.sort.due')}</SelectItem>
            <SelectItem value="amount">{t('invoice.sort.amount')}</SelectItem>
            <SelectItem value="supplier">{t('invoice.sort.supplier')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.map((invoice) => {
          const effective = effectiveStatus(invoice, today);
          return (
            <li key={invoice.id}>
              <Link
                href={`${moduleDef.path}/${invoice.id}`}
                className={cn(
                  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-card px-4 py-3',
                  effective === 'overdue' && 'border-destructive/50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {invoice.number} · {invoice.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[
                      supplierIndex.get(invoice.supplierId)?.name,
                      propertyIndex.get(invoice.propertyId)?.name,
                      invoice.date ? formatDate(invoice.date, settings.language) : '',
                      invoice.dueDate
                        ? `${t('invoice.dueDate')}: ${formatDate(invoice.dueDate, settings.language)}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(gross(invoice), invoice.currency || settings.currency)}
                </p>
                <StatusBadge
                  value={effective}
                  options={(config.statusOptions ?? []).map((option) => ({
                    ...option,
                    labelKey:
                      STATUS_LABEL[option.value as InvoiceStatus] ??
                      option.labelKey,
                  }))}
                />
              </Link>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t('list.noSearchResults')}
          </li>
        ) : null}
      </ul>

      <EntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`${t('action.new')} · ${t(moduleDef.singularKey)}`}
        fields={[
          ...config.fields,
          {
            kind: 'money',
            name: 'amount',
            labelKey: 'common.amount',
            required: false,
            span: 2,
          },
        ]}
        initialValues={defaultValuesOf('invoices')}
        onSubmit={createInvoice}
      />
    </div>
  );
}
