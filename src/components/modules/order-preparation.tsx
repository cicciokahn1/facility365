'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  Package,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useSettings } from '@/lib/settings/provider';
import { BaseEntity, CollectionKey, Order } from '@/lib/types';
import { formatDate } from '@/lib/utils/format';

interface OrderPreparationProps {
  order: Order;
}

interface LinkedEntity {
  collection: CollectionKey;
  entity: BaseEntity;
}

const PATHS: Partial<Record<CollectionKey, string>> = {
  damages: '/damages',
  maintenances: '/maintenances',
  inspections: '/inspections',
  firechecks: '/firesafety',
  playgroundchecks: '/playgrounds',
  rcd: '/rcd',
  cleaningtasks: '/cleaning/tasks',
};

const dateOf = (entity: BaseEntity): string => {
  const value = entity as BaseEntity & {
    completedAt?: string;
    lastDate?: string;
    date?: string;
    workDate?: string;
    reportedAt?: string;
  };
  return value.completedAt || value.lastDate || value.workDate || value.date || value.reportedAt || '';
};

const hrefOf = (entry: LinkedEntity): string => {
  const base = PATHS[entry.collection];
  return base ? `${base}/${entry.entity.id}` : '';
};

const textFields = (entity: BaseEntity): string[] => {
  const value = entity as BaseEntity & {
    notes?: string;
    description?: string;
    defects?: string;
    measures?: string;
    measurements?: string;
  };
  return [value.description, value.defects, value.measures, value.measurements, value.notes]
    .filter((text): text is string => Boolean(text?.trim()));
};

const checklistOf = (entity: BaseEntity): string[] => {
  const value = entity as BaseEntity & {
    checklist?: { text: string; done: boolean }[];
  };
  return (value.checklist ?? []).map((item) => item.text).filter(Boolean);
};

export function OrderPreparation({ order }: OrderPreparationProps) {
  const { settings } = useSettings();
  const customers = useCollectionItems('customers');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const suppliers = useCollectionItems('suppliers');
  const users = useCollectionItems('users');
  const documents = useCollectionItems('documents');
  const damages = useCollectionItems('damages');
  const maintenances = useCollectionItems('maintenances');
  const inspections = useCollectionItems('inspections');
  const firechecks = useCollectionItems('firechecks');
  const playgroundchecks = useCollectionItems('playgroundchecks');
  const rcd = useCollectionItems('rcd');
  const cleaningtasks = useCollectionItems('cleaningtasks');
  const tools = useCollectionItems('tools');
  const stock = useCollectionItems('stock');

  const sourceItems: LinkedEntity[] = [
    ...damages.map((entity) => ({ collection: 'damages' as const, entity })),
    ...maintenances.map((entity) => ({ collection: 'maintenances' as const, entity })),
    ...inspections.map((entity) => ({ collection: 'inspections' as const, entity })),
    ...firechecks.map((entity) => ({ collection: 'firechecks' as const, entity })),
    ...playgroundchecks.map((entity) => ({ collection: 'playgroundchecks' as const, entity })),
    ...rcd.map((entity) => ({ collection: 'rcd' as const, entity })),
    ...cleaningtasks.map((entity) => ({ collection: 'cleaningtasks' as const, entity })),
  ];
  const source = sourceItems.find(
    (entry) =>
      entry.collection === order.sourceCollection && entry.entity.id === order.sourceId,
  );
  const property = properties.find((item) => item.id === order.propertyId);
  const building = buildings.find((item) => item.id === order.buildingId);
  const room = rooms.find((item) => item.id === order.roomId);
  const asset = assets.find((item) => item.id === order.assetId);
  const customer = customers.find((item) => item.id === order.customerId);
  const supplier = suppliers.find((item) => item.id === order.supplierId);
  const assignee = users.find((item) => item.id === order.assigneeUserId);
  const objectEntries = [
    { label: 'Kunde / Organisation', value: customer?.name, href: customer ? `/customers/${customer.id}` : '' },
    { label: 'Liegenschaft', value: property?.name, href: property ? `/properties/${property.id}` : '' },
    { label: 'Gebäude', value: building?.name, href: building ? `/buildings/${building.id}` : '' },
    { label: 'Raum', value: room?.name, href: room ? `/rooms/${room.id}` : '' },
    { label: 'Anlage', value: asset?.name, href: asset ? `/assets/${asset.id}` : '' },
  ];
  const sourceTexts = source ? [...textFields(source.entity), ...checklistOf(source.entity)] : [];
  const instructions = [...checklistOf(order), ...sourceTexts].filter(
    (value, index, values) => values.indexOf(value) === index,
  );
  const safety = instructions.filter((item) => /psa|sicher|handschuh|schutz|schutzbrille/i.test(item));
  const linkedDocuments = documents.filter(
    (document) =>
      (document.orderId === order.id) ||
      (source && source.collection === 'maintenances' && document.maintenanceId === source.entity.id) ||
      (document.propertyId === order.propertyId && document.buildingId === order.buildingId),
  );
  const openDamages = damages.filter(
    (damage) =>
      damage.status !== 'fixed' &&
      damage.status !== 'rejected' &&
      Boolean(
        (order.propertyId && damage.propertyId === order.propertyId) ||
        (order.buildingId && damage.buildingId === order.buildingId) ||
        (order.roomId && damage.roomId === order.roomId) ||
        (order.assetId && damage.assetId === order.assetId),
      ),
  );
  const nearbyTools = tools.filter(
    (tool) =>
      (order.buildingId && tool.buildingId === order.buildingId) ||
      (order.propertyId && tool.propertyId === order.propertyId),
  );
  const materialRows = order.materials.map((material) => ({
    ...material,
    stockItem: stock.find((item) => item.id === material.stockItemId),
  }));
  const missing = [
    ...objectEntries.filter((entry) => !entry.value).map((entry) => entry.label),
    ...(!order.assigneeUserId && !order.assigneeTeam && !order.assignee ? ['Zuständigkeit'] : []),
    ...(!order.description.trim() && instructions.length === 0 ? ['Arbeitsanweisung'] : []),
    ...(order.materials.length === 0 ? ['Material'] : []),
    ...(nearbyTools.length === 0 ? ['Werkzeug / Gerät'] : []),
    ...(safety.length === 0 ? ['PSA / Sicherheitshinweis'] : []),
  ];

  const displayDate = (date: string): string =>
    date ? formatDate(date, settings.language) : '–';

  return (
    <div className="grid gap-4">
      {missing.length > 0 ? (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600" aria-hidden />
              Noch benötigt
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {missing.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4" aria-hidden />Objekt und Zuständigkeit</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {objectEntries.map((entry) => (
              <div key={entry.label} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{entry.label}</span>
                {entry.value && entry.href ? <Link className="font-medium text-primary hover:underline" href={entry.href}>{entry.value}</Link> : <span className="font-medium">{entry.value || 'Fehlt'}</span>}
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t pt-2"><span className="text-muted-foreground">Zuständig</span><span className="font-medium">{assignee?.name || order.assignee || order.assigneeTeam || supplier?.name || 'Fehlt'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4" aria-hidden />Aufgabe und Arbeitsanweisung</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{order.description || sourceTexts[0] || 'Keine Arbeitsanweisung hinterlegt.'}</p>
            {instructions.length > 0 ? <ul className="grid gap-1">{instructions.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />{item}</li>)}</ul> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Package className="size-4" aria-hidden />Material und Werkzeuge</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {materialRows.length > 0 ? <ul className="grid gap-1">{materialRows.map((item) => <li key={item.id} className="flex justify-between gap-3"><span>{item.name || item.stockItem?.title || 'Material'}</span><span className="text-muted-foreground">{item.quantity} {item.unit}</span></li>)}</ul> : <p className="text-muted-foreground">Kein Material im Auftrag erfasst.</p>}
            <div className="border-t pt-2">
              <p className="mb-1 font-medium">Werkzeuge / Geräte</p>
              {nearbyTools.length > 0 ? <ul className="grid gap-1">{nearbyTools.map((tool) => <li key={tool.id} className="flex items-center gap-2"><Wrench className="size-4 text-muted-foreground" aria-hidden />{tool.title}</li>)}</ul> : <p className="text-muted-foreground">Keine verknüpften Werkzeuge gefunden.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4" aria-hidden />PSA, Kontrollen und letzte Durchführung</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {safety.length > 0 ? safety.map((item) => <p key={item}>{item}</p>) : <p className="text-muted-foreground">Keine PSA- oder Sicherheitshinweise verknüpft.</p>}
            <div className="border-t pt-2"><span className="text-muted-foreground">Letzte Durchführung: </span>{displayDate(source ? dateOf(source.entity) : order.completedAt || order.workDate)}</div>
            {sourceTexts.filter((item) => /mess|result|kontroll|condition|wert/i.test(item)).map((item) => <p key={item} className="text-muted-foreground">{item}</p>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4" aria-hidden />Offene Schäden</CardTitle></CardHeader>
          <CardContent>{openDamages.length > 0 ? <ul className="grid gap-2">{openDamages.map((damage) => <li key={damage.id}><Link className="text-primary hover:underline" href={`/damages/${damage.id}`}>{damage.title || damage.number}</Link></li>)}</ul> : <p className="text-muted-foreground">Keine offenen Schäden am Objekt.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" aria-hidden />Vorhandene Dokumente</CardTitle></CardHeader>
          <CardContent>{linkedDocuments.length > 0 ? <ul className="grid gap-2">{linkedDocuments.map((document) => <li key={document.id}><Link className="text-primary hover:underline" href={`/documents/${document.id}`}>{document.title || document.file?.name || document.number}</Link></li>)}</ul> : <p className="text-muted-foreground">Keine verknüpften Dokumente.</p>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
