'use client';

/**
 * Zentrale Uebersicht ueber alle Organisationen.
 *
 * Je Organisation steht, wie viele Standorte, Liegenschaften, Gebaeude, Raeume
 * und Anlagen daran haengen und wie viel Arbeit offen ist. Standorte ohne
 * Organisation verschwinden nicht, sondern erscheinen als eigene Zeile.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { Network } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { isDone } from '@/lib/workflow/complete';

interface OrganizationSummary {
  id: string;
  name: string;
  sites: number;
  properties: number;
  buildings: number;
  rooms: number;
  assets: number;
  openOrders: number;
  openMaintenances: number;
}

export function OrganizationOverview() {
  const t = useT();
  const organizations = useCollectionItems('organizations');
  const sites = useCollectionItems('sites');
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');
  const orders = useCollectionItems('orders');
  const maintenances = useCollectionItems('maintenances');

  const summaries = useMemo(() => {
    /** Jede Ebene auf ihre Organisation zurueckfuehren, damit einmal gezaehlt reicht. */
    const orgOfSite = new Map<string, string>();
    sites.forEach((site) => orgOfSite.set(site.id, site.organizationId ?? ''));

    const orgOfProperty = new Map<string, string>();
    properties.forEach((property) =>
      orgOfProperty.set(property.id, orgOfSite.get(property.siteId) ?? ''),
    );

    const orgOfBuilding = new Map<string, string>();
    buildings.forEach((building) =>
      orgOfBuilding.set(building.id, orgOfProperty.get(building.propertyId) ?? ''),
    );

    const rows = new Map<string, OrganizationSummary>();
    const row = (id: string, name: string): OrganizationSummary => {
      const known = rows.get(id);
      if (known) return known;
      const created: OrganizationSummary = {
        id,
        name,
        sites: 0,
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

    organizations.forEach((organization) =>
      row(organization.id, organization.name || organization.number),
    );
    row('', t('organization.unassigned'));

    sites.forEach((site) => {
      const organization = rows.get(site.organizationId ?? '');
      if (organization) organization.sites += 1;
    });
    properties.forEach((property) => {
      const organization = rows.get(orgOfProperty.get(property.id) ?? '');
      if (organization) organization.properties += 1;
    });
    buildings.forEach((building) => {
      const organization = rows.get(orgOfBuilding.get(building.id) ?? '');
      if (organization) organization.buildings += 1;
    });
    rooms.forEach((room) => {
      const organization = rows.get(orgOfBuilding.get(room.buildingId) ?? '');
      if (organization) organization.rooms += 1;
    });
    assets.forEach((asset) => {
      const organization = rows.get(orgOfProperty.get(asset.propertyId) ?? '');
      if (organization) organization.assets += 1;
    });
    orders.forEach((order) => {
      if (isDone('orders', order.status)) return;
      const organization = rows.get(orgOfProperty.get(order.propertyId) ?? '');
      if (organization) organization.openOrders += 1;
    });
    maintenances.forEach((maintenance) => {
      if (isDone('maintenances', maintenance.status)) return;
      const organization = rows.get(orgOfProperty.get(maintenance.propertyId) ?? '');
      if (organization) organization.openMaintenances += 1;
    });

    const unassigned = rows.get('');
    const listed = [...rows.values()].filter((entry) => entry.id !== '');
    return unassigned && unassigned.sites > 0 ? [...listed, unassigned] : listed;
  }, [assets, buildings, maintenances, orders, organizations, properties, rooms, sites, t]);

  if (summaries.length === 0) return null;

  return (
    <Card data-testid="organization-overview">
      <CardHeader className="flex flex-row items-center gap-2">
        <Network className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="text-base">{t('organization.overview')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {summaries.map((summary) => {
          const content = (
            <>
              <span className="block text-sm font-medium">{summary.name}</span>
              <span className="text-xs text-muted-foreground">
                {t('module.sites')}: {summary.sites} · {t('module.properties')}: {summary.properties}{' '}
                · {t('module.buildings')}: {summary.buildings} · {t('module.rooms')}: {summary.rooms}{' '}
                · {t('module.assets')}: {summary.assets}
                <br />
                {t('site.openOrders')}: {summary.openOrders} · {t('site.dueMaintenances')}:{' '}
                {summary.openMaintenances}
              </span>
            </>
          );
          return summary.id ? (
            <Link
              key={summary.id}
              href={`/organizations/${summary.id}`}
              className="rounded-lg border p-3 hover:bg-accent"
              data-testid="organization-overview-item"
            >
              {content}
            </Link>
          ) : (
            <div
              key="unassigned"
              className="rounded-lg border border-dashed p-3"
              data-testid="organization-overview-unassigned"
              title={t('organization.unassignedHint')}
            >
              {content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
