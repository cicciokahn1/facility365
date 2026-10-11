'use client';

import Link from 'next/link';
import { Archive, ArchiveRestore, Globe, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { EntityDetail } from '@/components/module/entity-detail';
import { MapCard, NavigateButton } from '@/components/module/map-card';
import { RelatedList } from '@/components/module/related-list';
import { Button } from '@/components/ui/button';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { duplicateSuppliers } from '@/lib/suppliers/duplicates';

const websiteUrl = (value: string): string =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

export function SupplierDetail({ id }: { id: string }) {
  const t = useT();
  const suppliers = useCollectionItems('suppliers');
  const orders = useCollectionItems('orders');
  const invoices = useCollectionItems('invoices');
  const maintenances = useCollectionItems('maintenances');

  /** Objekte, in denen der Lieferant ueber Auftraege, Rechnungen oder Wartungen taetig ist. */
  const propertyIds = Array.from(
    new Set(
      [...orders, ...invoices, ...maintenances]
        .filter((item) => item.supplierId === id && item.propertyId)
        .map((item) => item.propertyId),
    ),
  );

  return (
    <EntityDetail
      collection="suppliers"
      id={id}
      headerExtra={(supplier, update) => {
        const phone = supplier.mobile || supplier.phone;
        return (
          <>
            {phone ? (
              <Button size="sm" asChild data-testid="supplier-call">
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                  <Phone className="size-4" aria-hidden />
                  {t('supplier.call')}
                </a>
              </Button>
            ) : null}
            {supplier.email ? (
              <Button size="sm" variant="outline" asChild data-testid="supplier-mail">
                <a href={`mailto:${supplier.email}`}>
                  <Mail className="size-4" aria-hidden />
                  {t('supplier.mail')}
                </a>
              </Button>
            ) : null}
            {supplier.website ? (
              <Button size="sm" variant="outline" asChild>
                <a href={websiteUrl(supplier.website)} target="_blank" rel="noreferrer">
                  <Globe className="size-4" aria-hidden />
                  {t('supplier.website')}
                </a>
              </Button>
            ) : null}
            <NavigateButton address={supplier.address} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const archived = supplier.status === 'inactive';
                update({ status: archived ? 'active' : 'inactive' });
                if (!archived) toast.success(t('supplier.archived'));
              }}
              data-testid="supplier-archive"
            >
              {supplier.status === 'inactive' ? (
                <ArchiveRestore className="size-4" aria-hidden />
              ) : (
                <Archive className="size-4" aria-hidden />
              )}
              {supplier.status === 'inactive' ? t('supplier.restore') : t('supplier.archive')}
            </Button>
          </>
        );
      }}
      beforeTabs={(supplier) => {
        const duplicates = duplicateSuppliers(suppliers, supplier, supplier.id);
        if (duplicates.length === 0) return null;
        return (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-medium">{t('supplier.duplicate')}</p>
            <p>{t('supplier.duplicateHint')}</p>
            <ul className="mt-1 list-disc pl-5">
              {duplicates.map((entry) => (
                <li key={entry.id}>
                  <Link className="underline" href={`/suppliers/${entry.id}`}>
                    {entry.number} · {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      }}
      extraTabs={(supplier) => [
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="supplierId" value={id} />,
        },
        {
          value: 'invoices',
          labelKey: 'module.invoices',
          content: <RelatedList collection="invoices" field="supplierId" value={id} />,
        },
        {
          value: 'maintenances',
          labelKey: 'module.maintenances',
          content: <RelatedList collection="maintenances" field="supplierId" value={id} />,
        },
        {
          value: 'properties',
          labelKey: 'module.properties',
          content: <RelatedList collection="properties" field="id" values={propertyIds} />,
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="supplierId" value={id} />,
        },
        {
          value: 'map',
          labelKey: 'tab.map',
          content: <MapCard address={supplier.address} />,
        },
      ]}
    />
  );
}
