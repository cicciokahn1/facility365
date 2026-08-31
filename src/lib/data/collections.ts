/**
 * Liste aller Sammlungen.
 *
 * Sie steht ausserhalb des Speichers, damit auch Sicherung, Datenuebernahme
 * und Export dieselbe Reihenfolge verwenden.
 */
import { CollectionKey } from '@/lib/types';

export const COLLECTIONS: CollectionKey[] = [
  'customers',
  'suppliers',
  'organizations',
  'sites',
  'properties',
  'buildings',
  'rooms',
  'assets',
  'documents',
  'energy',
  'solarplants',
  'solaryields',
  'orders',
  'maintenances',
  'legionella',
  'rcd',
  'inspections',
  'keys',
  'inventory',
  'vehicles',
  'tools',
  'stock',
  'contracts',
  'damages',
  'reports',
  'quotes',
  'invoices',
  'cleaningareas',
  'cleaners',
  'cleaningplans',
  'cleaningtasks',
  'cleaningchecks',
  'cleaningcomplaints',
  'users',
  'activities',
];
