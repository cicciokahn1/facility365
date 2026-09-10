'use client';

/**
 * Verknuepfungen eines Datensatzes und Folgevorgaenge.
 *
 * Der Bereich zeigt Herkunft, verknuepfte Datensaetze und alles, was aus dem
 * Vorgang entstanden ist. Die Schaltflaechen erzeugen daraus mit einem Klick
 * einen Auftrag oder ein Ticket - mit allen bereits erfassten Angaben.
 */
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Headset, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { StatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/lib/auth/scope';
import { useT } from '@/lib/i18n/provider';
import { useFollowUp } from '@/lib/links/follow-up';
import { LinkedRecord, useLinkedRecords } from '@/lib/links/related';
import { configOf } from '@/lib/module-config';
import { moduleByCollection } from '@/lib/modules';
import { BaseEntity, CollectionKey } from '@/lib/types';

const Row = ({ record }: { record: LinkedRecord }) => {
  const t = useT();
  const config = configOf(record.collection);
  const moduleDef = moduleByCollection(record.collection);
  const Icon = moduleDef.icon;

  return (
    <li>
      <Link href={record.path} className="flex items-center gap-3 p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">
            {t(moduleDef.singularKey)} · {record.number}
          </span>
          <span className="block truncate text-sm font-medium">
            {record.title}
          </span>
        </span>
        {config.statusField && config.statusOptions ? (
          <StatusBadge value={record.status} options={config.statusOptions} />
        ) : null}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
};

const Group = ({
  titleKey,
  records,
}: {
  titleKey: Parameters<ReturnType<typeof useT>>[0];
  records: LinkedRecord[];
}) => {
  const t = useT();
  if (records.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground">
        {t(titleKey)}
      </h3>
      <ul className="divide-y rounded-xl border bg-card">
        {records.map((record) => (
          <Row key={record.key} record={record} />
        ))}
      </ul>
    </section>
  );
};

export function LinkedRecordsPanel({
  collection,
  entity,
}: {
  collection: CollectionKey;
  entity: BaseEntity;
}) {
  const links = useLinkedRecords(collection, entity);
  const empty =
    !links.source && links.linked.length === 0 && links.follow.length === 0;

  if (empty) return <EmptyState icon={ChevronRight} titleKey="list.empty" />;

  return (
    <div className="flex flex-col gap-4" data-testid="linked-records">
      <Group
        titleKey="link.source"
        records={links.source ? [links.source] : []}
      />
      <Group titleKey="tab.linked" records={links.linked} />
      <Group titleKey="link.followUps" records={links.follow} />
    </div>
  );
}

/**
 * Auftrag oder Ticket aus dem Datensatz erzeugen.
 *
 * Besteht der Folgevorgang bereits, fuehrt die Schaltflaeche dorthin statt
 * einen zweiten anzulegen.
 */
export function FollowUpActions({
  collection,
  entity,
}: {
  collection: CollectionKey;
  entity: BaseEntity;
}) {
  const t = useT();
  const router = useRouter();
  const access = useAccess();
  const followUp = useFollowUp();

  const orders = followUp.orders(collection, entity);
  const tickets = followUp.tickets(collection, entity);
  const mayOrder = access.canWrite('orders');
  const mayTicket = access.canWrite('tickets');

  if (!mayOrder && !mayTicket && orders.length === 0 && tickets.length === 0) {
    return null;
  }

  return (
    <>
      {orders.length > 0 || mayOrder ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="follow-up-order"
          onClick={() => {
            const existing = orders[0];
            if (existing) {
              router.push(`/orders/${existing.id}`);
              return;
            }
            const order = followUp.createOrder(collection, entity);
            toast.success(t('link.orderCreated'));
            router.push(`/orders/${order.id}`);
          }}
        >
          <Wrench className="size-4" aria-hidden />
          {orders.length > 0 ? t('link.openOrder') : t('link.toOrder')}
        </Button>
      ) : null}
      {collection !== 'tickets' && (tickets.length > 0 || mayTicket) ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="follow-up-ticket"
          onClick={() => {
            const existing = tickets[0];
            if (existing) {
              router.push(`/tickets/${existing.id}`);
              return;
            }
            const ticket = followUp.createTicket(collection, entity);
            toast.success(t('link.ticketCreated'));
            router.push(`/tickets/${ticket.id}`);
          }}
        >
          <Headset className="size-4" aria-hidden />
          {tickets.length > 0 ? t('link.openTicket') : t('link.toTicket')}
        </Button>
      ) : null}
    </>
  );
}
