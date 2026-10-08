'use client';

/**
 * Beispiel-Liegenschaften mit allem drum und dran.
 *
 * Ein Knopfdruck legt drei komplette Liegenschaften an - mit Kunden,
 * Gebaeuden, Anlagen, Wartungen, Schaeden, Auftraegen, Terminen,
 * Reinigungsaufgaben und Aussenanlagen - damit die App sofort lebt.
 */
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useCollection } from '@/lib/data/store';
import { today } from '@/lib/utils/format';

const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export function DemoDataButton() {
  const customers = useCollection('customers');
  const properties = useCollection('properties');
  const buildings = useCollection('buildings');
  const assets = useCollection('assets');
  const maintenances = useCollection('maintenances');
  const damages = useCollection('damages');
  const orders = useCollection('orders');
  const appointments = useCollection('appointments');
  const cleaningTasks = useCollection('cleaningtasks');
  const outdoorAreas = useCollection('outdoorAreas');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (busy) return;
    setBusy(true);
    try {
      const customer = customers.create({
        name: 'Mustermann AG',
        firstName: 'Hans',
        email: 'info@mustermann.ch',
        phone: '+41 44 555 12 34',
        address: { street: 'Bahnhofstrasse 10', zip: '8001', city: 'Zürich', country: 'Schweiz' },
        type: 'company',
        status: 'active',
        notes: 'Beispielkunde - Verwaltung von drei Liegenschaften.',
      });
      const customer2 = customers.create({
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

      seeds.forEach((seed, index) => {
        const property = properties.create({
          name: seed.propertyName,
          address: { street: seed.propertyName, zip: seed.zip, city: seed.city, country: 'Schweiz' },
          customerId: index === 2 ? customer2.id : customer.id,
          status: 'active',
          notes: 'Beispiel-Liegenschaft.',
        });
        const building = buildings.create({
          name: seed.buildingName,
          propertyId: property.id,
          address: { street: seed.propertyName, zip: seed.zip, city: seed.city, country: 'Schweiz' },
          status: 'active',
          area: 1200 + index * 250,
        });
        const asset = assets.create({
          name: seed.assetName,
          propertyId: property.id,
          buildingId: building.id,
          status: 'active',
          category: 'hvac',
        });
        const area = outdoorAreas.create({
          name: seed.areaName,
          type: 'greenArea',
          status: 'active',
          propertyId: property.id,
          buildingId: building.id,
          area: 150 + index * 40,
          plantSpecies: seed.plants,
          nextCareDate: day(7 + index * 5),
        });
        maintenances.create({
          title: seed.maintenanceTitle,
          status: 'due',
          interval: index === 1 ? 'quarterly' : 'annual',
          propertyId: property.id,
          buildingId: building.id,
          assetId: asset.id,
          nextDate: day(3 + index * 10),
          lastDate: day(-90 - index * 30),
        });
        damages.create({
          title: seed.damageTitle,
          status: index === 0 ? 'inProgress' : 'reported',
          priority: index === 0 ? 'high' : 'medium',
          reportedAt: today(),
          propertyId: property.id,
          buildingId: building.id,
          assetId: asset.id,
          description: 'Beispielmeldung - an Ort und Stelle prüfen.',
        });
        orders.create({
          title: seed.orderTitle,
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
        appointments.create({
          title: `Begehung ${seed.propertyName}`,
          type: 'inspection',
          status: 'planned',
          date: day(5 + index * 7),
          repeat: 'none',
          customerId: index === 2 ? customer2.id : customer.id,
          propertyId: property.id,
        });
        cleaningTasks.create({
          title: seed.cleaningTitle,
          status: 'open',
          date: day(1 + index * 2),
          propertyId: property.id,
          buildingId: building.id,
        });
      });

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
