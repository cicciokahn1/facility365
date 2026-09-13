'use client';

import { useMemo, useState } from 'react';
import { CopyPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccess } from '@/lib/auth/scope';
import { useCollection } from '@/lib/data/store';
import { COLLECTIONS } from '@/lib/data/collections';
import { useSettings } from '@/lib/settings/provider';
import { newId } from '@/lib/utils/id';
import testSnapshot from '../../../testdata/Facility365-realistische-testdaten.json';
import type {
  Asset,
  Building,
  BuildingFloor,
  CleaningArea,
  CleaningPlan,
  CleaningTask,
  Customer,
  DocumentEntity,
  Inspection,
  Maintenance,
  Property,
  Room,
  Site,
} from '@/lib/types';

type TemplateKind =
  | 'care'
  | 'school'
  | 'administration'
  | 'residential'
  | 'industry'
  | 'testdata';

type SnapshotRecord = Record<string, unknown>;

interface TemplateDefinition {
  label: string;
  customer: string;
  site: string;
  property: string;
  building: string;
  city: string;
  street: string;
  postalCode: string;
  rooms: string[];
  assets: string[];
}

const TEMPLATES: Record<TemplateKind, TemplateDefinition> = {
  care: {
    label: 'Pflegeheim',
    customer: 'Vorlage Pflegezentrum',
    site: 'Standort Pflegezentrum',
    property: 'Pflegeheim Sonnenhof',
    building: 'Hauptgebäude Pflegeheim',
    city: 'Luzern',
    street: 'Sonnenweg 12',
    postalCode: '6005',
    rooms: ['Empfang', 'Speisesaal', 'Pflegestation 1', 'Pflegestation 2', 'Technikraum', 'Andachtsraum'],
    assets: ['Wärmeerzeugung', 'Aufzug', 'Notstromanlage'],
  },
  school: {
    label: 'Schule',
    customer: 'Vorlage Schulverband',
    site: 'Schulstandort',
    property: 'Schulgebäude',
    building: 'Schulhaus',
    city: 'Bern',
    street: 'Schulhausweg 4',
    postalCode: '3012',
    rooms: ['Eingangshalle', 'Klassenzimmer 1', 'Klassenzimmer 2', 'Lehrerzimmer', 'Turnhalle', 'Werkraum'],
    assets: ['Lüftungsanlage', 'Beleuchtung Turnhalle', 'Brandmeldeanlage'],
  },
  administration: {
    label: 'Verwaltungsgebäude',
    customer: 'Vorlage Stadtverwaltung',
    site: 'Verwaltungsstandort',
    property: 'Verwaltungsgebäude Zentrum',
    building: 'Verwaltungshochhaus',
    city: 'Zürich',
    street: 'Rathausplatz 1',
    postalCode: '8001',
    rooms: ['Empfang', 'Büro 1', 'Büro 2', 'Sitzungszimmer', 'Archiv', 'Serverraum'],
    assets: ['Kälteanlage', 'Personenaufzug', 'Serverklimatisierung'],
  },
  residential: {
    label: 'Mehrfamilienhaus',
    customer: 'Vorlage Immobilienverwaltung',
    site: 'Wohnstandort',
    property: 'Mehrfamilienhaus Limmatgarten',
    building: 'Wohnhaus A',
    city: 'Zürich',
    street: 'Limmatstrasse 88',
    postalCode: '8005',
    rooms: ['Waschküche', 'Technikraum', 'Veloraum', 'Treppenhaus', 'Eingang', 'Gemeinschaftsraum'],
    assets: ['Wärmepumpe', 'Boiler', 'Hebebühne Tiefgarage'],
  },
  industry: {
    label: 'Gewerbe/Industrie',
    customer: 'Vorlage Industriebetrieb',
    site: 'Produktionsstandort',
    property: 'Gewerbe- und Industriegebäude',
    building: 'Produktionshalle',
    city: 'St. Gallen',
    street: 'Industriestrasse 22',
    postalCode: '9000',
    rooms: ['Wareneingang', 'Produktion', 'Werkstatt', 'Labor', 'Büro', 'Versand'],
    assets: ['Produktionsmaschine', 'Druckluftanlage', 'Absauganlage'],
  },
  testdata: {
    label: 'TESTDATEN – vollständiges Praxisszenario',
    customer: 'TEST – Kunde Vorlagen',
    site: 'TEST – Standort Vorlagen',
    property: 'TEST – Liegenschaft Praxisszenario',
    building: 'TEST – Hauptgebäude',
    city: 'Luzern',
    street: 'Teststrasse 365',
    postalCode: '6000',
    rooms: ['TEST – Empfang', 'TEST – Büro', 'TEST – Technikraum', 'TEST – Lager', 'TEST – Sitzungszimmer', 'TEST – Sanitär'],
    assets: ['TEST – Heizung', 'TEST – Lüftung', 'TEST – Sicherheitsanlage'],
  },
};

const addressOf = (template: TemplateDefinition) => ({
  street: template.street,
  zip: template.postalCode,
  city: template.city,
  country: 'Schweiz',
});

const checklist = (text: string) => [
  { id: newId('check'), text, done: false },
];

export function PropertyTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TemplateKind>('care');
  const access = useAccess();
  const { settings } = useSettings();
  const customers = useCollection('customers');
  const sites = useCollection('sites');
  const properties = useCollection('properties');
  const buildings = useCollection('buildings');
  const rooms = useCollection('rooms');
  const assets = useCollection('assets');
  const maintenances = useCollection('maintenances');
  const inspections = useCollection('inspections');
  const cleaningareas = useCollection('cleaningareas');
  const cleaners = useCollection('cleaners');
  const cleaningplans = useCollection('cleaningplans');
  const cleaningtasks = useCollection('cleaningtasks');
  const documents = useCollection('documents');
  const suppliers = useCollection('suppliers');
  const sources = useCollection('sources');
  const organizations = useCollection('organizations');
  const energy = useCollection('energy');
  const solarplants = useCollection('solarplants');
  const solaryields = useCollection('solaryields');
  const appointments = useCollection('appointments');
  const orders = useCollection('orders');
  const legionella = useCollection('legionella');
  const rcd = useCollection('rcd');
  const playgroundchecks = useCollection('playgroundchecks');
  const firechecks = useCollection('firechecks');
  const keys = useCollection('keys');
  const inventory = useCollection('inventory');
  const vehicles = useCollection('vehicles');
  const tools = useCollection('tools');
  const stock = useCollection('stock');
  const contracts = useCollection('contracts');
  const damages = useCollection('damages');
  const tickets = useCollection('tickets');
  const reports = useCollection('reports');
  const quotes = useCollection('quotes');
  const invoices = useCollection('invoices');
  const cleaningchecks = useCollection('cleaningchecks');
  const cleaningcomplaints = useCollection('cleaningcomplaints');
  const users = useCollection('users');

  const template = useMemo(() => TEMPLATES[kind], [kind]);
  const actor = settings.profileName || settings.companyName || 'System';

  if (!access.canWrite('properties')) return null;

  const creators = {
    customers: customers.create,
    suppliers: suppliers.create,
    sources: sources.create,
    organizations: organizations.create,
    sites: sites.create,
    properties: properties.create,
    buildings: buildings.create,
    rooms: rooms.create,
    assets: assets.create,
    documents: documents.create,
    energy: energy.create,
    solarplants: solarplants.create,
    solaryields: solaryields.create,
    appointments: appointments.create,
    orders: orders.create,
    maintenances: maintenances.create,
    legionella: legionella.create,
    rcd: rcd.create,
    inspections: inspections.create,
    playgroundchecks: playgroundchecks.create,
    firechecks: firechecks.create,
    keys: keys.create,
    inventory: inventory.create,
    vehicles: vehicles.create,
    tools: tools.create,
    stock: stock.create,
    contracts: contracts.create,
    damages: damages.create,
    tickets: tickets.create,
    reports: reports.create,
    quotes: quotes.create,
    invoices: invoices.create,
    cleaningareas: cleaningareas.create,
    cleaners: cleaners.create,
    cleaningplans: cleaningplans.create,
    cleaningtasks: cleaningtasks.create,
    cleaningchecks: cleaningchecks.create,
    cleaningcomplaints: cleaningcomplaints.create,
    users: users.create,
  };

  const createTestEnvironment = () => {
    const idMap = new Map<string, string>();
    const created: { collection: keyof typeof creators; source: SnapshotRecord; id: string }[] = [];
    const collections = testSnapshot.collections as Partial<Record<keyof typeof creators, SnapshotRecord[]>>;

    COLLECTIONS.forEach((collection) => {
      const records = collections[collection as keyof typeof creators];
      const create = creators[collection as keyof typeof creators] as unknown as (
        values: SnapshotRecord,
        user: string,
      ) => SnapshotRecord;
      if (!records || !create) return;
      records.forEach((source) => {
        const entity = create(source, actor);
        const sourceId = typeof source.id === 'string' ? source.id : '';
        if (sourceId) idMap.set(sourceId, entity.id as string);
        created.push({
          collection: collection as keyof typeof creators,
          source,
          id: entity.id as string,
        });
      });
    });

    const remap = (value: unknown): unknown => {
      if (typeof value === 'string') return idMap.get(value) ?? value;
      if (Array.isArray(value)) return value.map(remap);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, remap(entry)]),
        );
      }
      return value;
    };

    created.forEach(({ collection, source, id }) => {
      const update = {
        customers: customers.update,
        suppliers: suppliers.update,
        sources: sources.update,
        organizations: organizations.update,
        sites: sites.update,
        properties: properties.update,
        buildings: buildings.update,
        rooms: rooms.update,
        assets: assets.update,
        documents: documents.update,
        energy: energy.update,
        solarplants: solarplants.update,
        solaryields: solaryields.update,
        appointments: appointments.update,
        orders: orders.update,
        maintenances: maintenances.update,
        legionella: legionella.update,
        rcd: rcd.update,
        inspections: inspections.update,
        playgroundchecks: playgroundchecks.update,
        firechecks: firechecks.update,
        keys: keys.update,
        inventory: inventory.update,
        vehicles: vehicles.update,
        tools: tools.update,
        stock: stock.update,
        contracts: contracts.update,
        damages: damages.update,
        tickets: tickets.update,
        reports: reports.update,
        quotes: quotes.update,
        invoices: invoices.update,
        cleaningareas: cleaningareas.update,
        cleaners: cleaners.update,
        cleaningplans: cleaningplans.update,
        cleaningtasks: cleaningtasks.update,
        cleaningchecks: cleaningchecks.update,
        cleaningcomplaints: cleaningcomplaints.update,
        users: users.update,
      }[collection] as (id: string, values: SnapshotRecord, action?: string, user?: string) => void;
      update(id, remap(source) as SnapshotRecord, 'history.templateImported', actor);
    });
    setOpen(false);
    toast.success(`TEST-Umgebung erstellt: ${created.length} verknüpfte Datensätze.`);
  };

  const createTemplate = () => {
    if (kind === 'testdata') {
      createTestEnvironment();
      return;
    }
    const address = addressOf(template);
    const marker = 'Vorlage – ';
    const customer = customers.create({
      name: template.customer,
      firstName: '',
      type: 'company',
      address,
      status: 'active',
      notes: `${marker}${template.label}`,
    } as Partial<Customer>, actor);

    const site = sites.create({
      name: template.site,
      shortName: template.site.slice(0, 3).toUpperCase(),
      customerId: customer.id,
      address,
      status: 'active',
      description: `${marker}${template.label}`,
      notes: `${marker}${template.label}`,
    }, actor);

    const floors: BuildingFloor[] = [
      {
        id: newId('floor'),
        name: 'Erdgeschoss',
        level: 0,
        area: 900,
        grossArea: 1000,
        netArea: 900,
        usableArea: 760,
        energyReferenceArea: 820,
        note: `${marker}Grundstruktur`,
      },
      {
        id: newId('floor'),
        name: '1. Obergeschoss',
        level: 1,
        area: 820,
        grossArea: 900,
        netArea: 820,
        usableArea: 690,
        energyReferenceArea: 750,
        note: `${marker}Grundstruktur`,
      },
    ];

    const property = properties.create({
      name: template.property,
      siteId: site.id,
      customerId: customer.id,
      address,
      status: 'active',
      contractStart: new Date().toISOString().slice(0, 10),
      contractEnd: '',
      plans: [],
      notes: `${marker}${template.label} – vollständig bearbeitbare Vorlage`,
    }, actor);

    const building = buildings.create({
      name: template.building,
      propertyId: property.id,
      address,
      yearBuilt: '2020',
      area: 1820,
      status: 'active',
      description: `${marker}${template.label}`,
      floors,
      plans: [],
      notes: `${marker}${template.label}`,
    } as Partial<Building>, actor);

    const createdRooms: Room[] = template.rooms.map((name, index) =>
      rooms.create({
        name,
        roomNumber: `${index + 1}.0${index + 1}`,
        buildingId: building.id,
        floorId: floors[index % floors.length].id,
        type: index === 0 ? 'Verkehrsfläche' : 'Nutzfläche',
        area: index % 2 === 0 ? 24 : 36,
        sia416AreaType: index === 0 ? 'VF' : 'HNF',
        din277AreaType: index === 0 ? 'VF' : 'NUF',
        status: 'active',
        description: `${marker}Raum`,
        notes: `${marker}${template.label}`,
      }, actor),
    );

    const createdAssets: Asset[] = template.assets.map((name, index) =>
      assets.create({
        name,
        category: index === 0 ? 'Heizung' : index === 1 ? 'Lüftung' : 'Sicherheit',
        manufacturer: 'Vorlagenhersteller',
        model: `V-${index + 1}00`,
        serialNumber: `${kind.toUpperCase()}-${index + 1}`,
        propertyId: property.id,
        buildingId: building.id,
        roomId: createdRooms[index + 1].id,
        location: createdRooms[index + 1].name,
        status: 'active',
        manufacturedYear: '2020',
        installedAt: '2020-06-01',
        warrantyUntil: '2025-06-01',
        warrantyNote: '',
        maintenanceInterval: '12 Monate',
        supplierId: '',
        lifecycle: 'inOperation',
        criticality: index === 0 ? 'high' : 'medium',
        notes: `${marker}${template.label}`,
      } as Partial<Asset>, actor),
    );

    createdAssets.forEach((asset, index) => {
      maintenances.create({
        title: `${marker}${asset.name} – Jahreswartung`,
        description: 'Wartung gemäss Vorlage, nach der Erstellung vollständig bearbeitbar.',
        status: 'planned',
        interval: index === 0 ? 'semiannual' : 'annual',
        propertyId: property.id,
        buildingId: building.id,
        assetId: asset.id,
        company: 'Interne Technik',
        supplierId: '',
        responsible: actor,
        assigneeUserId: '',
        assigneeTeam: 'Technik',
        lastDate: '',
        nextDate: new Date().toISOString().slice(0, 10),
        checklist: checklist('Sichtprüfung und Funktionstest'),
        notes: `${marker}${template.label}`,
      } as Partial<Maintenance>, actor);
    });

    inspections.create({
      title: `${marker}Sicherheitskontrolle Gebäude`,
      type: 'safety',
      customType: '',
      organizationId: '',
      siteId: site.id,
      propertyId: property.id,
      buildingId: building.id,
      roomId: '',
      assetId: createdAssets[2].id,
      date: new Date().toISOString().slice(0, 10),
      tester: actor,
      supplierId: '',
      assigneeUserId: '',
      assigneeTeam: 'Technik',
      interval: 'annual',
      nextDate: new Date().toISOString().slice(0, 10),
      result: 'pending',
      status: 'open',
      measures: '',
      legalBasis: 'Betreiberpflichten',
      dutyCategory: 'Sicherheit',
      notes: `${marker}${template.label}`,
    } as Partial<Inspection>, actor);

    const area = cleaningareas.create({
      name: `${marker}Gemeinschafts- und Verkehrsflächen`,
      type: 'office',
      propertyId: property.id,
      buildingId: building.id,
      roomId: createdRooms[0].id,
      location: 'Erdgeschoss und Treppenhaus',
      area: 180,
      floorCovering: 'Hartbelag',
      minutesPer100m2: 45,
      responsibleId: '',
      status: 'active',
      description: 'Reinigungsbereich aus der Liegenschaftsvorlage.',
      checklist: checklist('Böden reinigen und Abfall entsorgen'),
      notes: `${marker}${template.label}`,
    } as Partial<CleaningArea>, actor);

    const cleaner = cleaners.create({
      name: 'Vorlagen Reinigung',
      firstName: 'Team',
      role: 'cleaner',
      phone: '',
      mobile: '',
      email: '',
      supplierId: '',
      status: 'active',
      notes: `${marker}${template.label}`,
    }, actor);

    const plan = cleaningplans.create({
      title: `${marker}Wöchentliche Grundreinigung`,
      areaId: area.id,
      cleanerId: cleaner.id,
      responsibleId: '',
      interval: 'weekly',
      timeStart: '18:00',
      startDate: new Date().toISOString().slice(0, 10),
      nextDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      checklist: checklist('Reinigungscheckliste abarbeiten'),
      tour: 'Standardtour',
      tourOrder: 1,
      durationMinutes: 90,
      notes: `${marker}${template.label}`,
    } as Partial<CleaningPlan>, actor);

    cleaningtasks.create({
      title: `${marker}Erste Reinigungsaufgabe`,
      planId: plan.id,
      areaId: area.id,
      propertyId: property.id,
      buildingId: building.id,
      roomId: createdRooms[0].id,
      cleanerId: cleaner.id,
      responsibleId: '',
      assigneeUserId: '',
      assigneeTeam: 'Reinigung',
      date: new Date().toISOString().slice(0, 10),
      status: 'open',
      workStart: '',
      workEnd: '',
      breakMinutes: 0,
      completedAt: '',
      checklist: checklist('Bereich kontrollieren'),
      materials: [],
      notes: `${marker}${template.label}`,
    } as Partial<CleaningTask>, actor);

    documents.create({
      title: `${marker}${template.building} – Grunddokumentation`,
      category: 'technical',
      organizationId: '',
      siteId: site.id,
      customerId: customer.id,
      propertyId: property.id,
      buildingId: building.id,
      roomId: '',
      assetId: '',
      orderId: '',
      maintenanceId: '',
      validUntil: '',
      sharedWithCustomer: false,
      safetyEvidence: true,
      versions: [],
      notes: `${marker}${template.label} – Dokument kann nachträglich ergänzt werden.`,
    } as Partial<DocumentEntity>, actor);

    documents.create({
      title: `${marker}Raumbuch und Flächenübersicht`,
      category: 'other',
      organizationId: '',
      siteId: site.id,
      customerId: customer.id,
      propertyId: property.id,
      buildingId: building.id,
      roomId: '',
      assetId: '',
      orderId: '',
      maintenanceId: '',
      validUntil: '',
      sharedWithCustomer: false,
      safetyEvidence: false,
      versions: [],
      notes: `${marker}${template.label}`,
    } as Partial<DocumentEntity>, actor);

    setOpen(false);
    toast.success(`${template.label} wurde als Liegenschaftsvorlage erstellt.`);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CopyPlus className="size-4" aria-hidden />
        Liegenschaft aus Vorlage
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Liegenschaft aus Vorlage erstellen</DialogTitle>
            <DialogDescription>
              Die Vorlage erstellt eine bearbeitbare Grundstruktur mit Verknüpfungen von Kunde bis Dokumentation.
            </DialogDescription>
          </DialogHeader>
          <Select value={kind} onValueChange={(value) => setKind(value as TemplateKind)}>
            <SelectTrigger>
              <SelectValue placeholder="Vorlage auswählen" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([value, entry]) => (
                <SelectItem key={value} value={value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Erstellt werden Kunde, Standort, Liegenschaft, Gebäude, zwei Geschosse, sechs Räume,
            drei Anlagen, Wartungen, Kontrolle, Reinigung und Dokumentation.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={createTemplate}>Vorlage erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
