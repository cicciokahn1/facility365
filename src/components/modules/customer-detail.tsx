'use client';

import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { ContactEditor } from '@/components/modules/contact-editor';
import { ContractEditor } from '@/components/modules/contract-editor';
import { useCollectionItems } from '@/lib/data/store';

export function CustomerDetail({ id }: { id: string }) {
  const properties = useCollectionItems('properties');
  /** Auftraege haengen an der Liegenschaft; deshalb ueber alle Objekte des Kunden. */
  const propertyIds = properties.filter((property) => property.customerId === id).map((p) => p.id);

  return (
    <EntityDetail
      collection="customers"
      id={id}
      extraTabs={(customer, update) => [
        {
          value: 'contacts',
          labelKey: 'tab.contacts',
          content: (
            <ContactEditor contacts={customer.contacts} onChange={(contacts) => update({ contacts })} />
          ),
        },
        {
          value: 'properties',
          labelKey: 'module.properties',
          content: <RelatedList collection="properties" field="customerId" value={id} />,
        },
        {
          value: 'orders',
          labelKey: 'module.orders',
          content: <RelatedList collection="orders" field="propertyId" values={propertyIds} />,
        },
        {
          value: 'reports',
          labelKey: 'module.reports',
          content: <RelatedList collection="reports" field="customerId" value={id} />,
        },
        {
          value: 'quotes',
          labelKey: 'module.quotes',
          content: <RelatedList collection="quotes" field="customerId" value={id} />,
        },
        {
          value: 'invoices',
          labelKey: 'module.invoices',
          content: <RelatedList collection="invoices" field="customerId" value={id} />,
        },
        {
          value: 'contracts',
          labelKey: 'tab.contracts',
          content: (
            <ContractEditor
              contracts={customer.contracts}
              onChange={(contracts) => update({ contracts })}
            />
          ),
        },
      ]}
    />
  );
}
