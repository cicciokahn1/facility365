/**
 * Leere Datensaetze je Sammlung.
 *
 * Jedes Modul startet mit denselben Grundfeldern; die Vorlagen halten die
 * Formulare frei von Sonderfaellen und verhindern undefinierte Felder.
 */
import {
  Address,
  Asset,
  BaseEntity,
  Building,
  CollectionKey,
  Customer,
  Damage,
  DocumentEntity,
  EntityOf,
  Invoice,
  Maintenance,
  Order,
  Property,
  Quote,
  Report,
  Room,
} from '@/lib/types';

export const emptyAddress = (): Address => ({ street: '', zip: '', city: '', country: 'Schweiz' });

const base = (): Omit<BaseEntity, 'id' | 'number'> => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: '',
  photos: [],
  documents: [],
  history: [],
});

/** Praefix der laufenden Nummer je Sammlung. */
export const NUMBER_PREFIX: Record<CollectionKey, string> = {
  customers: 'KD',
  properties: 'LI',
  buildings: 'GB',
  rooms: 'RM',
  assets: 'ANL',
  documents: 'DK',
  orders: 'AU',
  maintenances: 'WA',
  damages: 'SC',
  reports: 'RP',
  quotes: 'OF',
  invoices: 'RE',
};

/**
 * Stellenzahl der laufenden Nummer.
 *
 * Anlagen tragen eine dauerhafte, sechsstellige Kennung (ANL-000123), weil sie
 * als QR-Etikett am Geraet klebt und nie wieder geaendert wird.
 */
export const NUMBER_PAD: Partial<Record<CollectionKey, number>> = {
  assets: 6,
};

export const emptyCustomer = (): Omit<Customer, 'id' | 'number'> => ({
  ...base(),
  type: 'company',
  name: '',
  firstName: '',
  address: emptyAddress(),
  phone: '',
  mobile: '',
  email: '',
  website: '',
  status: 'active',
  contacts: [],
  contracts: [],
});

export const emptyProperty = (): Omit<Property, 'id' | 'number'> => ({
  ...base(),
  name: '',
  customerId: '',
  address: emptyAddress(),
  status: 'active',
  contractStart: '',
  contractEnd: '',
  plans: [],
});

export const emptyBuilding = (): Omit<Building, 'id' | 'number'> => ({
  ...base(),
  name: '',
  propertyId: '',
  address: emptyAddress(),
  yearBuilt: '',
  status: 'active',
  description: '',
  floors: [],
  plans: [],
});

export const emptyRoom = (): Omit<Room, 'id' | 'number'> => ({
  ...base(),
  name: '',
  roomNumber: '',
  buildingId: '',
  floorId: '',
  type: '',
  status: 'active',
  description: '',
});

export const emptyAsset = (): Omit<Asset, 'id' | 'number'> => ({
  ...base(),
  name: '',
  category: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  location: '',
  status: 'active',
  manufacturedYear: '',
  installedAt: '',
  warrantyUntil: '',
  warrantyNote: '',
  maintenanceInterval: '',
});

export const emptyDocument = (): Omit<DocumentEntity, 'id' | 'number'> => ({
  ...base(),
  title: '',
  category: '',
  customerId: '',
  propertyId: '',
  buildingId: '',
  assetId: '',
  validUntil: '',
});

export const emptyOrder = (): Omit<Order, 'id' | 'number'> => ({
  ...base(),
  title: '',
  description: '',
  status: 'new',
  priority: 'medium',
  customerId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  assetId: '',
  assignee: '',
  dueDate: '',
  startedAt: '',
  completedAt: '',
  workDate: '',
  workStart: '',
  workEnd: '',
  breakMinutes: 0,
  checklist: [],
  materials: [],
  signature: '',
  signedBy: '',
});

export const emptyMaintenance = (): Omit<Maintenance, 'id' | 'number'> => ({
  ...base(),
  title: '',
  description: '',
  status: 'planned',
  interval: 'annual',
  propertyId: '',
  buildingId: '',
  assetId: '',
  company: '',
  responsible: '',
  lastDate: '',
  nextDate: '',
  checklist: [],
});

export const emptyDamage = (): Omit<Damage, 'id' | 'number'> => ({
  ...base(),
  title: '',
  description: '',
  status: 'reported',
  priority: 'medium',
  customerId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  assetId: '',
  reportedBy: '',
  reportedAt: new Date().toISOString().slice(0, 10),
  fixedAt: '',
  insuranceCase: false,
});

export const emptyReport = (): Omit<Report, 'id' | 'number'> => ({
  ...base(),
  title: '',
  type: 'daily',
  status: 'draft',
  date: new Date().toISOString().slice(0, 10),
  author: '',
  customerId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  assetId: '',
  orderId: '',
  summary: '',
  workDescription: '',
  workStart: '',
  workEnd: '',
  breakMinutes: 0,
  materials: [],
  signature: '',
  signedBy: '',
  signedAt: '',
});

export const emptyQuote = (): Omit<Quote, 'id' | 'number'> => ({
  ...base(),
  title: '',
  status: 'draft',
  customerId: '',
  propertyId: '',
  date: new Date().toISOString().slice(0, 10),
  validUntil: '',
  introText: '',
  items: [],
  currency: 'CHF',
});

export const emptyInvoice = (): Omit<Invoice, 'id' | 'number'> => ({
  ...base(),
  title: '',
  status: 'draft',
  customerId: '',
  propertyId: '',
  orderId: '',
  quoteId: '',
  reportId: '',
  date: new Date().toISOString().slice(0, 10),
  dueDate: '',
  paidAt: '',
  items: [],
  currency: 'CHF',
  qrReference: '',
});

const FACTORIES = {
  customers: emptyCustomer,
  properties: emptyProperty,
  buildings: emptyBuilding,
  rooms: emptyRoom,
  assets: emptyAsset,
  documents: emptyDocument,
  orders: emptyOrder,
  maintenances: emptyMaintenance,
  damages: emptyDamage,
  reports: emptyReport,
  quotes: emptyQuote,
  invoices: emptyInvoice,
} as const;

/** Leerer Datensatz einer Sammlung, noch ohne Kennung und Nummer. */
export const emptyEntity = <K extends CollectionKey>(collection: K) =>
  FACTORIES[collection]() as Omit<EntityOf<K>, 'id' | 'number'>;
