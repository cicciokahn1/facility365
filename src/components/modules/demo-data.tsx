'use client';

/**
 * Beispiel-Liegenschaften mit allem drum und dran.
 *
 * Beim ersten Start (leere App) werden drei komplette Liegenschaften
 * automatisch angelegt - mit Kunden, Gebaeuden, Anlagen, Wartungen,
 * Schaeden, Auftraegen, Terminen, Reinigungsaufgaben und Aussenanlagen.
 * In den Einstellungen laesst sich der Satz per Knopfdruck erneut laden.
 */
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CollectionApi, useCollection } from '@/lib/data/store';
import { today } from '@/lib/utils/format';

const SEEDED_KEY = 'facility365.demo.seeded';

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

interface DemoCollections {
  customers: CollectionApi<'customers'>;
  properties: CollectionApi<'properties'>;
  buildings: CollectionApi<'buildings'>;
  assets: CollectionApi<'assets'>;
  maintenances: CollectionApi<'maintenances'>;
  damages: CollectionApi<'damages'>;
  orders: CollectionApi<'orders'>;
  appointments: CollectionApi<'appointments'>;
  cleaningTasks: CollectionApi<'cleaningtasks'>;
  outdoorAreas: CollectionApi<'outdoorAreas'>;
}

const seed = (c: DemoCollections) => {
  const customer = c.customers.create({
    name: 'Mustermann AG',
    firstName: 'Hans',
    email: 'info@mustermann.ch',
    phone: '+41 44 555 12 34',
    address: { street: 'Bahnhofstrasse 10', zip: '8001', city: 'Zürich', country: 'Schweiz' },
    type: 'company',
    status: 'active',
    notes: 'Beispielkunde - Verwaltung von drei Liegenschaften.',
  });
  const customer2 = c.customers.create({
    name: 'Meier Immobilien GmbH',
    firstName: 'Anna',
    email: 'anna@meier-immo.ch',
    phone: '+41 61 555 98 76',
    address: { street: 'Rheinweg 5', zip: '4051', city: 'Basel', country: 'Schweiz' },
    type: 'company',
    status: 'active',
  });

  const seeds = [
    {
      propertyName: 'Überlandstrasse 12',
      city: 'Winterthur',
      zip: '8400',
      buildingName: 'Block A',
      assetName: 'Heizung Keller',
      orderTitle: 'Dachrinne reinigen',
      damageTitle: 'Wasserfleck Decke EG',
      maintenanceTitle: 'Heizungswartung jährlich',
      cleaningTitle: 'Treppenhausreinigung',
      areaName: 'Vorgarten Süd',
      plants: 'Rasen mit Kirschlorbeer',
    },
    {
      propertyName: 'Sonnenweg 3',
      city: 'Bern',
      zip: '3005',
      buildingName: 'Wohnhaus West',
      assetName: 'Lift Haustechnik',
      orderTitle: 'Glühbirnen Ersatzleuchten prüfen',
      damageTitle: 'Türschloss Eingang klemmt',
      maintenanceTitle: 'Liftkontrolle quartalsweise',
      cleaningTitle: 'Waschküche reinigen',
      areaName: 'Garten Nord',
      plants: 'Thuja-Hecke, Ginkgobaum',
    },
    {
      propertyName: 'Seestrasse 88',
      city: 'Rapperswil',
      zip: '8640',
      buildingName: 'Gewerbebau See',
      assetName: 'Lüftung Dach',
      orderTitle: 'Lüftungsfilter wechseln',
      damageTitle: 'Riss Fensterbank 2. OG',
      maintenanceTitle: 'Brandschutzprüfung jährlich',
      cleaningTitle: 'Eingangsbereich wöchentlich',
      areaName: 'Dachterrasse',
      plants: 'Bambus, Lavendel',
    },
  ] as const;

  seeds.forEach((entry, index) => {
    const property = c.properties.create({
      name: entry.propertyName,
      address: { street: entry.propertyName, zip: entry.zip, city: entry.city, country: 'Schweiz' },
      customerId: index === 2 ? customer2.id : customer.id,
      status: 'active',
      notes: 'Beispiel-Liegenschaft.',
    });
    const building = c.buildings.create({
      name: entry.buildingName,
      propertyId: property.id,
      address: { street: entry.propertyName, zip: entry.zip, city: entry.city, country: 'Schweiz' },
      status: 'active',
      area: 1200 + index * 250,
    });
    const asset = c.assets.create({
      name: entry.assetName,
      propertyId: property.id,
      buildingId: building.id,
      status: 'active',
      category: 'hvac',
    });
    const area = c.outdoorAreas.create({
      name: entry.areaName,
      type: 'greenArea',
      status: 'active',
      propertyId: property.id,
      buildingId: building.id,
      area: 150 + index * 40,
      plantSpecies: entry.plants,
      nextCareDate: day(7 + index * 5),
    });
    c.maintenances.create({
      title: entry.maintenanceTitle,
      status: 'due',
      interval: index === 1 ? 'quarterly' : 'annual',
      propertyId: property.id,
      buildingId: building.id,
      assetId: asset.id,
      nextDate: day(3 + index * 10),
      lastDate: day(-90 - index * 30),
    });
    c.damages.create({
      title: entry.damageTitle,
      status: index === 0 ? 'inProgress' : 'reported',
      priority: index === 0 ? 'high' : 'medium',
      reportedAt: today(),
      propertyId: property.id,
      buildingId: building.id,
      assetId: asset.id,
      description: 'Beispielmeldung - an Ort und Stelle prüfen.',
    });
    c.orders.create({
      title: entry.orderTitle,
      status: 'new',
      priority: 'medium',
      dueDate: day(4 + index * 6),
      customerId: index === 2 ? customer2.id : customer.id,
      propertyId: property.id,
      buildingId: building.id,
      assetId: asset.id,
      outdoorAreaId: area.id,
      description: 'Beispielauftrag.',
    });
    c.appointments.create({
      title: `Begehung ${entry.propertyName}`,
      type: 'inspection',
      status: 'planned',
      date: day(5 + index * 7),
      repeat: 'none',
      customerId: index === 2 ? customer2.id : customer.id,
      propertyId: property.id,
    });
    c.cleaningTasks.create({
      title: entry.cleaningTitle,
      status: 'open',
      date: day(1 + index * 2),
      propertyId: property.id,
      buildingId: building.id,
    });
  });
};

const useDemoCollections = (): DemoCollections => ({
  customers: useCollection('customers'),
  properties: useCollection('properties'),
  buildings: useCollection('buildings'),
  assets: useCollection('assets'),
  maintenances: useCollection('maintenances'),
  damages: useCollection('damages'),
  orders: useCollection('orders'),
  appointments: useCollection('appointments'),
  cleaningTasks: useCollection('cleaningtasks'),
  outdoorAreas: useCollection('outdoorAreas'),
});

export function DemoDataButton() {
  const collections = useDemoCollections();
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (busy) return;
    setBusy(true);
    try {
      seed(collections);
      toast.success('3 Beispiel-Liegenschaften mit allem angelegt');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" className="w-fit" onClick={load} disabled={busy} data-testid="load-demo-data">
      <Sparkles className="size-4" aria-hidden />
      {busy ? 'Wird erstellt…' : 'Beispiel-Daten laden'}
    </Button>
  );
}

/**
 * Legt die Beispiel-Liegenschaften automatisch an, sobald die Sammlungen
 * bereit und noch leer sind. Laeuft genau einmal je Geraet: wer alles
 * loescht, kann den Satz in den Einstellungen erneut laden.
 */
export function DemoAutoSeed() {
  const collections = useDemoCollections();
  const done = useRef(false);

  const collectionsReady =
    collections.customers.ready &&
    collections.properties.ready &&
    collections.orders.ready;

  useEffect(() => {
    if (done.current || !collectionsReady) return;
    if (window.localStorage.getItem(SEEDED_KEY)) return;
    const empty =
      collections.customers.items.length === 0 &&
      collections.properties.items.length === 0 &&
      collections.orders.items.length === 0;
    if (!empty) {
      window.localStorage.setItem(SEEDED_KEY, '1');
      return;
    }
    done.current = true;
    window.localStorage.setItem(SEEDED_KEY, '1');
    seed(collections);
    toast.success('3 Beispiel-Liegenschaften mit allem angelegt');
  }, [collections, collectionsReady]);

  return null;
}
