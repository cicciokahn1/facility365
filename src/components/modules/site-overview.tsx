'use client';

/**
 * Zentrale Uebersicht ueber alle Standorte.
 *
 * Je Standort steht, wie viele Liegenschaften, Gebaeude, Raeume und Anlagen
 * daran haengen und wie viel Arbeit offen ist. Liegenschaften ohne Standort
 * verschwinden nicht, sondern erscheinen als eigene Zeile.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { isDone } from '@/lib/workflow/complete';

interface SiteSummary {
  id: string;
  name: string;
  properties: number;
  buildings: number;
  rooms: number;
  assets: number;
  openOrders: number;
  openMaintenances: number;
}

export function SiteOverview() {
  const t = useT();
  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');

  const summaries = useMemo(() => {
    /** Liegenschaft → Standort, damit jede Ebene in einem Durchgang zaehlbar ist. */
    const siteOfProperty = new Map<string, string>();
    properties.forEach((property) => siteOfProperty.set(property.id, property.siteId ?? ''));

    const siteOfBuilding = new Map<string, string>();
    buildings.forEach((building) =>
      siteOfBuilding.set(building.id, siteOfProperty.get(building.propertyId) ?? ''),
    );

    const rows = new Map<string, SiteSummary>();
    const row = (id: string, name: string): SiteSummary => {
      const known = rows.get(id);
      if (known) return known;
      const created: SiteSummary = {
        id,
        name,
        properties: 0,
        buildings: 0,
        rooms: 0,
        assets: 0,
        openOrders: 0,
        openMaintenances: 0,
      };
      rows.set(id, created);
      return created;
    };

    sites.forEach((site) => row(site.id, site.name || site.number));
    row('', t('site.unassigned'));

    properties.forEach((property) => {
      const site = rows.get(property.siteId ?? '');
      if (site) site.properties += 1;
    });
    buildings.forEach((building) => {
      const site = rows.get(siteOfBuilding.get(building.id) ?? '');
      if (site) site.buildings += 1;
    });
    rooms.forEach((room) => {
      const site = rows.get(siteOfBuilding.get(room.buildingId) ?? '');
      if (site) site.rooms += 1;
    });
    assets.forEach((asset) => {
      const site = rows.get(siteOfProperty.get(asset.propertyId) ?? '');
      if (site) site.assets += 1;
    });
    orders.forEach((order) => {
      if (isDone('orders', order.status)) return;
      const site = rows.get(siteOfProperty.get(order.propertyId) ?? '');
      if (site) site.openOrders += 1;
    });
    maintenances.forEach((maintenance) => {
      if (isDone('maintenances', maintenance.status)) return;
      const site = rows.get(siteOfProperty.get(maintenance.propertyId) ?? '');
      if (site) site.openMaintenances += 1;
    });

    const unassigned = rows.get('');
    const listed = [...rows.values()].filter((entry) => entry.id !== '');
    return unassigned && unassigned.properties > 0 ? [...listed, unassigned] : listed;
  }, [assets, buildings, maintenances, orders, properties, rooms, sites, t]);

  if (summaries.length === 0) return null;

  return (
    <Card data-testid="site-overview">
      <CardHeader className="flex flex-row items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="text-base">{t('site.overview')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {summaries.map((summary) => {
          const counts = (
            <span className="text-xs text-muted-foreground">
              {t('module.properties')}: {summary.properties} · {t('module.buildings')}:{' '}
              {summary.buildings} · {t('module.rooms')}: {summary.rooms} · {t('module.assets')}:{' '}
              {summary.assets}
              <br />
              {t('site.openOrders')}: {summary.openOrders} · {t('site.dueMaintenances')}:{' '}
              {summary.openMaintenances}
            </span>
          );
          const content = (
            <>
              <span className="block text-sm font-medium">{summary.name}</span>
              {counts}
            </>
          );
          return summary.id ? (
            <Link
              key={summary.id}
              href={`/sites/${summary.id}`}
              className="rounded-lg border p-3 hover:bg-accent"
              data-testid="site-overview-item"
            >
              {content}
            </Link>
          ) : (
            <div
              key="unassigned"
              className="rounded-lg border border-dashed p-3"
              data-testid="site-overview-unassigned"
              title={t('site.unassignedHint')}
            >
              {content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
