'use client';

/**
 * Beispiel-Liegenschaften mit allem drum und dran.
 *
 * Beim ersten Start (leere App) wird ein kompletter Betrieb angelegt:
 * acht Liegenschaften von vier Kunden mit Gebaeuden, Anlagen, Wartungen,
 * Schaeden, Auftraegen, Tickets, Rapporten, Terminen, Reinigungsaufgaben
 * und Aussenanlagen - in unterschiedlichen Zustaenden wie im Alltag.
 * In den Einstellungen laesst sich der Satz per Knopfdruck erneut laden.
 */
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CollectionApi, useCollection } from '@/lib/data/store';
import {
  DamageStatus,
  MaintenanceInterval,
  MaintenanceStatus,
  OrderStatus,
  OutdoorAreaType,
  Priority,
  TicketCategory,
  TicketStatus,
} from '@/lib/types';

const SEEDED_KEY = 'facility365.examples.seeded.v2';
const SEEDED_V1_KEY = 'facility365.demo.seeded';
const DEMO_NOTE = 'Beispiel-Daten';

/** Namen des ersten, kleineren Beispielsatzes; werden beim Wechsel ersetzt. */
const V1_NAMES = new Set([
  'Mustermann AG',
  'Meier Immobilien GmbH',
  'Überlandstrasse 12',
  'Sonnenweg 3',
  'Seestrasse 88',
  'Block A',
  'Wohnhaus West',
  'Gewerbebau See',
  'Heizung Keller',
  'Lift Haustechnik',
  'Lüftung Dach',
  'Vorgarten Süd',
  'Garten Nord',
  'Dachterrasse',
  'Heizungswartung jährlich',
  'Liftkontrolle quartalsweise',
  'Brandschutzprüfung jährlich',
  'Wasserfleck Decke EG',
  'Türschloss Eingang klemmt',
  'Riss Fensterbank 2. OG',
  'Dachrinne reinigen',
  'Glühbirnen Ersatzleuchten prüfen',
  'Lüftungsfilter wechseln',
  'Begehung Überlandstrasse 12',
  'Begehung Sonnenweg 3',
  'Begehung Seestrasse 88',
  'Treppenhausreinigung',
  'Waschküche reinigen',
  'Eingangsbereich wöchentlich',
]);

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
  tickets: CollectionApi<'tickets'>;
  reports: CollectionApi<'reports'>;
  appointments: CollectionApi<'appointments'>;
  cleaningTasks: CollectionApi<'cleaningtasks'>;
  outdoorAreas: CollectionApi<'outdoorAreas'>;
}

interface CustomerSeed {
  name: string;
  firstName: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
}

const CUSTOMERS: CustomerSeed[] = [
  { name: 'Mustermann Verwaltung AG', firstName: 'Hans', email: 'info@mustermann-verwaltung.ch', phone: '+41 44 555 12 34', street: 'Bahnhofstrasse 10', zip: '8001', city: 'Zürich' },
  { name: 'Meier Immobilien GmbH', firstName: 'Anna', email: 'anna.meier@meier-immo.ch', phone: '+41 61 555 98 76', street: 'Rheinweg 5', zip: '4051', city: 'Basel' },
  { name: 'Stockwerkeigentümer Sonnenhof', firstName: 'Peter', email: 'praesident@sonnenhof-stwe.ch', phone: '+41 31 555 44 21', street: 'Sonnenhofweg 2', zip: '3006', city: 'Bern' },
  { name: 'Gemeinde Seedorf', firstName: 'Claudia', email: 'liegenschaften@seedorf.ch', phone: '+41 41 555 70 00', street: 'Dorfplatz 1', zip: '6460', city: 'Altdorf' },
];

interface AssetSeed {
  name: string;
  category: string;
  manufacturer: string;
  status: 'active' | 'maintenance' | 'defect';
}

interface MaintenanceSeed {
  title: string;
  interval: MaintenanceInterval;
  status: MaintenanceStatus;
  next: number;
  company: string;
  asset: number;
}

interface DamageSeed {
  title: string;
  description: string;
  status: DamageStatus;
  priority: Priority;
  reported: number;
  cost: number;
  asset?: number;
}

interface OrderSeed {
  title: string;
  description: string;
  status: OrderStatus;
  priority: Priority;
  due: number;
  assignee: string;
  asset?: number;
  outdoor?: boolean;
}

interface TicketSeed {
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: Priority;
  reportedBy: string;
  reported: number;
}

interface PropertySeed {
  name: string;
  street: string;
  zip: string;
  city: string;
  customer: number;
  buildings: { name: string; area: number }[];
  assets: AssetSeed[];
  outdoor: { name: string; type: OutdoorAreaType; area: number; plants: string; tasks: string; nextCare: number };
  maintenances: MaintenanceSeed[];
  damages: DamageSeed[];
  orders: OrderSeed[];
  tickets: TicketSeed[];
  appointment: { title: string; type: string; date: number; repeat: string };
  cleaning: { title: string; date: number; status: 'open' | 'inProgress' | 'done' }[];
}

const PROPERTIES: PropertySeed[] = [
  {
    name: 'Wohnüberbauung Lindenhof',
    street: 'Lindenstrasse 12–18',
    zip: '8400',
    city: 'Winterthur',
    customer: 0,
    buildings: [{ name: 'Haus A (Nr. 12)', area: 1850 }, { name: 'Haus B (Nr. 16)', area: 1620 }],
    assets: [
      { name: 'Gasheizung Hoval UltraGas', category: 'heating', manufacturer: 'Hoval', status: 'active' },
      { name: 'Personenlift Haus A', category: 'elevator', manufacturer: 'Schindler', status: 'active' },
      { name: 'Tiefgaragentor', category: 'security', manufacturer: 'Hörmann', status: 'defect' },
    ],
    outdoor: { name: 'Innenhof mit Spielplatz', type: 'playground', area: 420, plants: 'Rasen, Hainbuchenhecke, 2 Linden', tasks: 'Rasen mähen, Hecke schneiden im Juni, Spielgeräte prüfen', nextCare: 2 },
    maintenances: [
      { title: 'Heizungsservice jährlich', interval: 'annual', status: 'due', next: 2, company: 'Hoval AG', asset: 0 },
      { title: 'Liftwartung Haus A', interval: 'quarterly', status: 'overdue', next: -4, company: 'Schindler Aufzüge AG', asset: 1 },
    ],
    damages: [
      { title: 'Garagentor schliesst nicht', description: 'Tor bleibt auf halber Höhe stehen, Lichtschranke prüfen.', status: 'inProgress', priority: 'high', reported: -1, cost: 650, asset: 2 },
      { title: 'Wasserfleck Decke Treppenhaus Haus B', description: 'Brauner Fleck 3. OG, vermutlich Leck im Dachbereich.', status: 'reported', priority: 'medium', reported: 0, cost: 400 },
    ],
    orders: [
      { title: 'Garagentor reparieren', description: 'Lichtschranke und Endschalter ersetzen.', status: 'inProgress', priority: 'high', due: 0, assignee: 'Marco Rossi', asset: 2 },
      { title: 'Treppenhaus-Leuchten ersetzen', description: '4 defekte LED-Leuchten im Haus B ersetzen.', status: 'planned', priority: 'medium', due: 3, assignee: 'Marco Rossi' },
      { title: 'Spielplatz Sicherheitskontrolle', description: 'Jährliche Kontrolle nach SN EN 1176.', status: 'done', priority: 'medium', due: -6, assignee: 'Lukas Weber', outdoor: true },
    ],
    tickets: [
      { title: 'Waschmaschine Haus A defekt', description: 'Mieterin meldet: Maschine zeigt Fehler E21.', category: 'fault', status: 'new', priority: 'medium', reportedBy: 'Frau Keller, 2. OG', reported: 0 },
    ],
    appointment: { title: 'Begehung mit Verwaltung', type: 'visit', date: 4, repeat: 'none' },
    cleaning: [
      { title: 'Treppenhausreinigung Haus A + B', date: 0, status: 'open' },
      { title: 'Tiefgarage wischen', date: 5, status: 'open' },
    ],
  },
  {
    name: 'Geschäftshaus Bahnhofplatz',
    street: 'Bahnhofplatz 3',
    zip: '8001',
    city: 'Zürich',
    customer: 0,
    buildings: [{ name: 'Bürogebäude', area: 4200 }],
    assets: [
      { name: 'Lüftungsanlage Dach', category: 'ventilation', manufacturer: 'Swegon', status: 'maintenance' },
      { name: 'Brandmeldeanlage', category: 'fireAlarm', manufacturer: 'Siemens', status: 'active' },
      { name: 'Kälteanlage Serverraum', category: 'climate', manufacturer: 'Daikin', status: 'active' },
    ],
    outdoor: { name: 'Vorplatz mit Pflanzentrögen', type: 'planting', area: 120, plants: 'Buchs, Lavendel, Gräser', tasks: 'Tröge giessen, Unkraut entfernen', nextCare: 1 },
    maintenances: [
      { title: 'Filterwechsel Lüftung', interval: 'semiannual', status: 'due', next: 0, company: 'Swegon Schweiz', asset: 0 },
      { title: 'Brandmeldeanlage Revision', interval: 'annual', status: 'planned', next: 21, company: 'Siemens Schweiz AG', asset: 1 },
      { title: 'Kälteanlage Dichtheitskontrolle', interval: 'annual', status: 'done', next: 340, company: 'Daikin Service', asset: 2 },
    ],
    damages: [
      { title: 'Eingangstür schliesst schwer', description: 'Türschliesser verstellt, Tür schlägt zu.', status: 'fixed', priority: 'low', reported: -10, cost: 180 },
    ],
    orders: [
      { title: 'Lüftungsfilter wechseln', description: 'F7-Filter Zu- und Abluft ersetzen.', status: 'new', priority: 'medium', due: 0, assignee: 'Lukas Weber', asset: 0 },
      { title: 'Mieterausbau 3. OG Wände streichen', description: 'Büro 3.04 nach Mieterwechsel neu streichen.', status: 'planned', priority: 'low', due: 9, assignee: 'Malerei Bühler' },
    ],
    tickets: [
      { title: 'Zu warm im Sitzungszimmer', description: 'Raum 2.10 über 26 °C, Klimaanlage prüfen.', category: 'request', status: 'inProgress', priority: 'medium', reportedBy: 'Empfang', reported: -1 },
    ],
    appointment: { title: 'Brandschutz-Übung', type: 'service', date: 12, repeat: 'none' },
    cleaning: [
      { title: 'Büroreinigung täglich', date: 0, status: 'inProgress' },
      { title: 'Fensterreinigung aussen', date: 14, status: 'open' },
    ],
  },
  {
    name: 'Mehrfamilienhaus Rheinblick',
    street: 'Rheinweg 22',
    zip: '4058',
    city: 'Basel',
    customer: 1,
    buildings: [{ name: 'Wohnhaus', area: 980 }],
    assets: [
      { name: 'Wärmepumpe Luft/Wasser', category: 'heating', manufacturer: 'Stiebel Eltron', status: 'active' },
      { name: 'Warmwasserboiler 500 l', category: 'plumbing', manufacturer: 'Domotec', status: 'active' },
    ],
    outdoor: { name: 'Garten am Rhein', type: 'lawn', area: 260, plants: 'Rasen, Kirschlorbeer, Apfelbaum', tasks: 'Rasen mähen, Laub im Herbst', nextCare: 6 },
    maintenances: [
      { title: 'Wärmepumpe Service', interval: 'annual', status: 'planned', next: 30, company: 'Stiebel Eltron Service', asset: 0 },
      { title: 'Boiler entkalken', interval: 'biennial', status: 'overdue', next: -12, company: 'Sanitär Huber', asset: 1 },
    ],
    damages: [
      { title: 'Wasserhahn Waschküche tropft', description: 'Dichtung ersetzen.', status: 'reported', priority: 'low', reported: -2, cost: 80, asset: 1 },
    ],
    orders: [
      { title: 'Boiler entkalken', description: 'Boiler entleeren, entkalken, Anode prüfen.', status: 'new', priority: 'high', due: 1, assignee: 'Sanitär Huber', asset: 1 },
      { title: 'Rasen vertikutieren', description: 'Frühjahrspflege Garten.', status: 'done', priority: 'low', due: -8, assignee: 'Lukas Weber', outdoor: true },
    ],
    tickets: [],
    appointment: { title: 'Wohnungsübergabe 2. OG links', type: 'appointment', date: 2, repeat: 'none' },
    cleaning: [{ title: 'Treppenhaus wöchentlich', date: 1, status: 'open' }],
  },
  {
    name: 'Gewerbezentrum Dreispitz',
    street: 'Dreispitzstrasse 40',
    zip: '4142',
    city: 'Münchenstein',
    customer: 1,
    buildings: [{ name: 'Halle 1', area: 3200 }, { name: 'Bürotrakt', area: 1400 }],
    assets: [
      { name: 'Sektionaltor Rampe 1', category: 'security', manufacturer: 'Hörmann', status: 'active' },
      { name: 'Sprinkleranlage', category: 'fireAlarm', manufacturer: 'Minimax', status: 'active' },
      { name: 'Photovoltaik Dach 120 kWp', category: 'electrical', manufacturer: 'Meyer Burger', status: 'active' },
    ],
    outdoor: { name: 'Parkplatz und Grünstreifen', type: 'greenArea', area: 800, plants: 'Wildblumenwiese, Feldahorn', tasks: '2× jährlich mähen, Abfall einsammeln', nextCare: 10 },
    maintenances: [
      { title: 'Sprinkler Halbjahreskontrolle', interval: 'semiannual', status: 'due', next: 5, company: 'Minimax AG', asset: 1 },
      { title: 'PV-Anlage Sichtkontrolle', interval: 'annual', status: 'planned', next: 45, company: 'Solar Basel GmbH', asset: 2 },
    ],
    damages: [
      { title: 'Rampe 1: Anfahrschaden Torpfosten', description: 'LKW hat Pfosten gestreift, Tor läuft schief.', status: 'inspection', priority: 'high', reported: -3, cost: 1800, asset: 0 },
    ],
    orders: [
      { title: 'Torpfosten Rampe 1 richten', description: 'Pfosten ersetzen, Tor neu einstellen. Versicherungsfall.', status: 'planned', priority: 'high', due: 2, assignee: 'Hörmann Service', asset: 0 },
      { title: 'Dachrinnen Halle 1 reinigen', description: 'Laub und Schmutz entfernen.', status: 'paused', priority: 'medium', due: -2, assignee: 'Marco Rossi' },
    ],
    tickets: [
      { title: 'Licht Parkplatz aus', description: 'Kandelaber 3 und 4 brennen nicht.', category: 'fault', status: 'waiting', priority: 'medium', reportedBy: 'Mieter Logistik AG', reported: -4 },
    ],
    appointment: { title: 'Mieterbesprechung Logistik AG', type: 'meeting', date: 7, repeat: 'none' },
    cleaning: [{ title: 'Sanitäranlagen Bürotrakt', date: 0, status: 'done' }],
  },
  {
    name: 'STWE Sonnenhof',
    street: 'Sonnenhofweg 2–6',
    zip: '3006',
    city: 'Bern',
    customer: 2,
    buildings: [{ name: 'Haus Ost', area: 1300 }, { name: 'Haus West', area: 1250 }],
    assets: [
      { name: 'Pelletheizung', category: 'heating', manufacturer: 'ÖkoFEN', status: 'active' },
      { name: 'Lift Haus Ost', category: 'elevator', manufacturer: 'KONE', status: 'active' },
    ],
    outdoor: { name: 'Gemeinschaftsgarten', type: 'hedge', area: 350, plants: 'Thujahecke, Rosen, Ginkgo', tasks: 'Hecke schneiden, Rosen düngen', nextCare: 3 },
    maintenances: [
      { title: 'Pelletheizung Kaminfeger', interval: 'annual', status: 'due', next: 6, company: 'Kaminfeger Bern', asset: 0 },
      { title: 'Lift Haus Ost Wartung', interval: 'quarterly', status: 'planned', next: 18, company: 'KONE Schweiz', asset: 1 },
    ],
    damages: [
      { title: 'Briefkastenanlage beschädigt', description: 'Klappe Nr. 4 abgebrochen.', status: 'reported', priority: 'low', reported: -1, cost: 120 },
    ],
    orders: [
      { title: 'Pellets nachbestellen', description: '6 Tonnen Pellets für Winter bestellen.', status: 'new', priority: 'medium', due: 5, assignee: 'Peter Graf' },
      { title: 'Hecke schneiden', description: 'Thujahecke auf 1,80 m zurückschneiden.', status: 'planned', priority: 'low', due: 3, assignee: 'Lukas Weber', outdoor: true },
    ],
    tickets: [
      { title: 'Velokeller Licht flackert', description: 'Neonröhre ersetzen.', category: 'fault', status: 'new', priority: 'low', reportedBy: 'Hr. Zürcher, Haus West', reported: 0 },
    ],
    appointment: { title: 'Eigentümerversammlung', type: 'meeting', date: 20, repeat: 'none' },
    cleaning: [{ title: 'Treppenhaus Haus Ost + West', date: 2, status: 'open' }],
  },
  {
    name: 'Schulhaus Seedorf',
    street: 'Schulweg 5',
    zip: '6462',
    city: 'Seedorf UR',
    customer: 3,
    buildings: [{ name: 'Schulhaus', area: 2600 }, { name: 'Turnhalle', area: 900 }],
    assets: [
      { name: 'Fernwärme Übergabestation', category: 'heating', manufacturer: 'Danfoss', status: 'active' },
      { name: 'Lüftung Turnhalle', category: 'ventilation', manufacturer: 'Zehnder', status: 'active' },
      { name: 'Notbeleuchtung', category: 'electrical', manufacturer: 'Zumtobel', status: 'maintenance' },
    ],
    outdoor: { name: 'Pausenplatz und Sportwiese', type: 'playground', area: 2100, plants: 'Sportrasen, Kastanienbäume', tasks: 'Rasen mähen, Linien markieren, Spielgeräte prüfen', nextCare: 1 },
    maintenances: [
      { title: 'Notbeleuchtung Funktionstest', interval: 'semiannual', status: 'overdue', next: -7, company: 'Elektro Arnold', asset: 2 },
      { title: 'Lüftung Turnhalle Filter', interval: 'annual', status: 'planned', next: 40, company: 'Zehnder Service', asset: 1 },
    ],
    damages: [
      { title: 'Fensterscheibe Schulzimmer 12 gesprungen', description: 'Ballwurf, Scheibe gesprungen – abgesperrt.', status: 'inProgress', priority: 'high', reported: -1, cost: 900 },
    ],
    orders: [
      { title: 'Scheibe Schulzimmer 12 ersetzen', description: 'Glaser bestellt, Zimmer bis dahin gesperrt.', status: 'inProgress', priority: 'high', due: 1, assignee: 'Glas Trösch' },
      { title: 'Notbeleuchtung prüfen', description: 'Alle Notleuchten testen, Batterien ersetzen.', status: 'new', priority: 'critical', due: -1, assignee: 'Elektro Arnold', asset: 2 },
      { title: 'Sportwiese Linien markieren', description: 'Fussballfeld neu markieren.', status: 'done', priority: 'low', due: -3, assignee: 'Lukas Weber', outdoor: true },
    ],
    tickets: [
      { title: 'WC Knaben verstopft', description: 'Lehrerin meldet verstopftes WC im EG.', category: 'fault', status: 'done', priority: 'high', reportedBy: 'Frau Arnold, Lehrerin', reported: -2 },
    ],
    appointment: { title: 'Rundgang Hauswart', type: 'service', date: 1, repeat: 'weekly' },
    cleaning: [
      { title: 'Schulzimmer Unterhaltsreinigung', date: 0, status: 'open' },
      { title: 'Turnhalle Bodenpflege', date: 3, status: 'open' },
    ],
  },
  {
    name: 'Gemeindehaus Seedorf',
    street: 'Dorfplatz 1',
    zip: '6462',
    city: 'Seedorf UR',
    customer: 3,
    buildings: [{ name: 'Gemeindehaus', area: 1100 }],
    assets: [
      { name: 'Ölheizung', category: 'heating', manufacturer: 'Viessmann', status: 'active' },
      { name: 'Zutrittskontrolle', category: 'security', manufacturer: 'dormakaba', status: 'active' },
    ],
    outdoor: { name: 'Dorfplatz Rabatten', type: 'planting', area: 90, plants: 'Geranien, Tulpen, Buchskugeln', tasks: 'Saisonbepflanzung wechseln, giessen', nextCare: 8 },
    maintenances: [
      { title: 'Ölheizung Brennerservice', interval: 'annual', status: 'due', next: 9, company: 'Viessmann Service', asset: 0 },
    ],
    damages: [],
    orders: [
      { title: 'Herbstbepflanzung Dorfplatz', description: 'Geranien raus, Herbstastern setzen.', status: 'new', priority: 'low', due: 8, assignee: 'Lukas Weber', outdoor: true },
      { title: 'Badge-Leser Eingang Ost tauschen', description: 'Leser reagiert nicht mehr zuverlässig.', status: 'planned', priority: 'medium', due: 6, assignee: 'dormakaba Service', asset: 1 },
    ],
    tickets: [
      { title: 'Saal für Anlass vorbereiten', description: '80 Stühle, Beamer, Bühne für Samstag.', category: 'request', status: 'inProgress', priority: 'medium', reportedBy: 'Gemeindeschreiberei', reported: -1 },
    ],
    appointment: { title: 'Gemeindeversammlung Saal', type: 'appointment', date: 5, repeat: 'none' },
    cleaning: [{ title: 'Büros und Saal reinigen', date: 1, status: 'open' }],
  },
  {
    name: 'Alterszentrum Abendrot',
    street: 'Abendrotweg 9',
    zip: '6460',
    city: 'Altdorf',
    customer: 3,
    buildings: [{ name: 'Pflegetrakt', area: 3800 }, { name: 'Wohntrakt', area: 2400 }],
    assets: [
      { name: 'Bettenlift Pflegetrakt', category: 'elevator', manufacturer: 'Schindler', status: 'active' },
      { name: 'Notstromaggregat', category: 'electrical', manufacturer: 'Caterpillar', status: 'active' },
      { name: 'Gebäudeleittechnik', category: 'automation', manufacturer: 'Siemens', status: 'active' },
    ],
    outdoor: { name: 'Sinnesgarten', type: 'greenArea', area: 600, plants: 'Lavendel, Rosmarin, Hochbeete, Rosen', tasks: 'Hochbeete pflegen, Wege rollstuhlgängig halten', nextCare: 4 },
    maintenances: [
      { title: 'Notstrom Probelauf', interval: 'monthly', status: 'due', next: 1, company: 'Elektro Arnold', asset: 1 },
      { title: 'Bettenlift Wartung', interval: 'quarterly', status: 'planned', next: 25, company: 'Schindler Aufzüge AG', asset: 0 },
    ],
    damages: [
      { title: 'Handlauf Korridor 2. OG locker', description: 'Sturzgefahr – sofort sichern.', status: 'reported', priority: 'critical', reported: 0, cost: 250 },
    ],
    orders: [
      { title: 'Handlauf 2. OG befestigen', description: 'Neue Dübel setzen, Handlauf fest verschrauben.', status: 'new', priority: 'critical', due: 0, assignee: 'Marco Rossi' },
      { title: 'Hochbeete bepflanzen', description: 'Kräuter mit Bewohnern pflanzen.', status: 'planned', priority: 'low', due: 4, assignee: 'Lukas Weber', outdoor: true },
    ],
    tickets: [
      { title: 'Zimmer 214 Heizung kalt', description: 'Bewohnerin friert, Thermostat prüfen.', category: 'fault', status: 'new', priority: 'high', reportedBy: 'Pflege Station 2', reported: 0 },
    ],
    appointment: { title: 'Notstrom Probelauf', type: 'service', date: 1, repeat: 'monthly' },
    cleaning: [{ title: 'Eingangshalle und Cafeteria', date: 0, status: 'open' }],
  },
];

const removeV1 = (c: DemoCollections) => {
  const named = (item: { id: string; name?: string; title?: string }) =>
    V1_NAMES.has(item.name ?? '') || V1_NAMES.has(item.title ?? '');
  c.customers.items.filter(named).forEach((item) => c.customers.remove(item.id));
  c.properties.items.filter(named).forEach((item) => c.properties.remove(item.id));
  c.buildings.items.filter(named).forEach((item) => c.buildings.remove(item.id));
  c.assets.items.filter(named).forEach((item) => c.assets.remove(item.id));
  c.outdoorAreas.items.filter(named).forEach((item) => c.outdoorAreas.remove(item.id));
  c.maintenances.items.filter(named).forEach((item) => c.maintenances.remove(item.id));
  c.damages.items.filter(named).forEach((item) => c.damages.remove(item.id));
  c.orders.items.filter(named).forEach((item) => c.orders.remove(item.id));
  c.appointments.items.filter(named).forEach((item) => c.appointments.remove(item.id));
  c.cleaningTasks.items.filter(named).forEach((item) => c.cleaningTasks.remove(item.id));
};

const seed = (c: DemoCollections) => {
  const customers = CUSTOMERS.map((entry) =>
    c.customers.create({
      name: entry.name,
      firstName: entry.firstName,
      email: entry.email,
      phone: entry.phone,
      address: { street: entry.street, zip: entry.zip, city: entry.city, country: 'Schweiz' },
      type: 'company',
      status: 'active',
      notes: DEMO_NOTE,
    }),
  );

  PROPERTIES.forEach((entry) => {
    const customerId = customers[entry.customer].id;
    const address = { street: entry.street, zip: entry.zip, city: entry.city, country: 'Schweiz' };
    const property = c.properties.create({
      name: entry.name,
      address,
      customerId,
      status: 'active',
      notes: DEMO_NOTE,
    });
    const buildings = entry.buildings.map((building) =>
      c.buildings.create({
        name: building.name,
        propertyId: property.id,
        address,
        status: 'active',
        area: building.area,
      }),
    );
    const mainBuilding = buildings[0].id;
    const assets = entry.assets.map((asset) =>
      c.assets.create({
        name: asset.name,
        category: asset.category,
        manufacturer: asset.manufacturer,
        status: asset.status,
        propertyId: property.id,
        buildingId: mainBuilding,
      }),
    );
    const area = c.outdoorAreas.create({
      name: entry.outdoor.name,
      type: entry.outdoor.type,
      status: 'active',
      propertyId: property.id,
      buildingId: mainBuilding,
      area: entry.outdoor.area,
      plantSpecies: entry.outdoor.plants,
      seasonalTasks: entry.outdoor.tasks,
      lastCareDate: day(-14),
      nextCareDate: day(entry.outdoor.nextCare),
    });
    entry.maintenances.forEach((maintenance) =>
      c.maintenances.create({
        title: maintenance.title,
        status: maintenance.status,
        interval: maintenance.interval,
        company: maintenance.company,
        propertyId: property.id,
        buildingId: mainBuilding,
        assetId: assets[maintenance.asset]?.id ?? '',
        nextDate: day(maintenance.next),
        lastDate: day(maintenance.next - 365),
      }),
    );
    entry.damages.forEach((damage) =>
      c.damages.create({
        title: damage.title,
        description: damage.description,
        status: damage.status,
        priority: damage.priority,
        reportedAt: day(damage.reported),
        estimatedCost: damage.cost,
        propertyId: property.id,
        buildingId: mainBuilding,
        assetId: damage.asset === undefined ? '' : assets[damage.asset].id,
      }),
    );
    entry.orders.forEach((order) => {
      const created = c.orders.create({
        title: order.title,
        description: order.description,
        status: order.status,
        priority: order.priority,
        dueDate: day(order.due),
        assignee: order.assignee,
        customerId,
        propertyId: property.id,
        buildingId: mainBuilding,
        assetId: order.asset === undefined ? '' : assets[order.asset].id,
        outdoorAreaId: order.outdoor ? area.id : '',
        startedAt: order.status === 'new' || order.status === 'planned' ? '' : day(Math.min(order.due, 0)),
        completedAt: order.status === 'done' ? day(order.due) : '',
      });
      if (order.status === 'done') {
        c.reports.create({
          title: `Rapport: ${order.title}`,
          type: 'order',
          status: 'final',
          date: day(order.due),
          author: order.assignee,
          customerId,
          propertyId: property.id,
          buildingId: mainBuilding,
          orderId: created.id,
          summary: 'Arbeit ausgeführt, alles in Ordnung.',
          workDescription: order.description,
          workStart: '08:00',
          workEnd: '10:30',
          breakMinutes: 0,
          sharedWithCustomer: true,
        });
      }
    });
    entry.tickets.forEach((ticket) =>
      c.tickets.create({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        reportedBy: ticket.reportedBy,
        reportedAt: day(ticket.reported),
        dueDate: day(ticket.reported + 3),
        customerId,
        propertyId: property.id,
        buildingId: mainBuilding,
      }),
    );
    c.appointments.create({
      title: entry.appointment.title,
      type: entry.appointment.type,
      status: 'planned',
      date: day(entry.appointment.date),
      repeat: entry.appointment.repeat,
      customerId,
      propertyId: property.id,
      location: `${entry.street}, ${entry.city}`,
    });
    entry.cleaning.forEach((task) =>
      c.cleaningTasks.create({
        title: task.title,
        status: task.status,
        date: day(task.date),
        propertyId: property.id,
        buildingId: mainBuilding,
      }),
    );
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
  tickets: useCollection('tickets'),
  reports: useCollection('reports'),
  appointments: useCollection('appointments'),
  cleaningTasks: useCollection('cleaningtasks'),
  outdoorAreas: useCollection('outdoorAreas'),
});

const SUCCESS = '8 Beispiel-Liegenschaften mit allem angelegt';

export function DemoDataButton() {
  const collections = useDemoCollections();
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (busy) return;
    setBusy(true);
    try {
      seed(collections);
      toast.success(SUCCESS);
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

/** Eigene Eintraege tragen die Sammlung als Kennungs-Praefix; mitgelieferte Testdaten nicht. */
const ownEntry = (collection: string) => (item: { id: string }) =>
  item.id.startsWith(`${collection}_`);

/** Wartezeit, bis auch die nachgeladenen Sammlungen im Speicher stehen. */
const SETTLE_MS = 5000;

/**
 * Legt die Beispiel-Liegenschaften automatisch an, sobald alle Daten geladen
 * sind: auf einem leeren Geraet oder als Ersatz des ersten, kleineren
 * Beispielsatzes. Laeuft genau einmal je Geraet.
 */
export function DemoAutoSeed() {
  const collections = useDemoCollections();
  const latest = useRef(collections);
  const done = useRef(false);

  const collectionsReady = Object.values(collections).every((collection) => collection.ready);

  useEffect(() => {
    latest.current = collections;
  }, [collections]);

  useEffect(() => {
    if (done.current || !collectionsReady) return;
    if (window.localStorage.getItem(SEEDED_KEY)) return;
    const timer = window.setTimeout(() => {
      const current = latest.current;
      if (done.current || window.localStorage.getItem(SEEDED_KEY)) return;
      done.current = true;
      window.localStorage.setItem(SEEDED_KEY, '1');
      const hadV1 =
        Boolean(window.localStorage.getItem(SEEDED_V1_KEY)) &&
        current.properties.items.some((item) => V1_NAMES.has(item.name));
      if (hadV1) {
        removeV1(current);
      } else {
        const empty =
          !current.customers.items.some(ownEntry('customers')) &&
          !current.properties.items.some(ownEntry('properties')) &&
          !current.orders.items.some(ownEntry('orders'));
        if (!empty) return;
      }
      seed(current);
      toast.success(SUCCESS);
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [collectionsReady]);

  return null;
}
