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
  Cleaner,
  CleaningArea,
  CleaningCheck,
  CleaningComplaint,
  CleaningPlan,
  CleaningTask,
  CollectionKey,
  ContractEntity,
  Customer,
  Damage,
  DocumentEntity,
  EnergyEntry,
  EntityOf,
  Invoice,
  KeyEntity,
  LegionellaCheck,
  Maintenance,
  Order,
  Property,
  Quote,
  RcdCheck,
  Report,
  Room,
  Site,
  StockItem,
  Supplier,
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
  suppliers: 'LF',
  sites: 'ST',
  properties: 'LI',
  buildings: 'GB',
  rooms: 'RM',
  assets: 'ANL',
  documents: 'DK',
  energy: 'EN',
  orders: 'AU',
  maintenances: 'WA',
  legionella: 'LEG',
  rcd: 'FI',
  keys: 'SL',
  stock: 'LA',
  contracts: 'VT',
  damages: 'SC',
  reports: 'RP',
  quotes: 'OF',
  invoices: 'RE',
  cleaningareas: 'RB',
  cleaners: 'RK',
  cleaningplans: 'RPL',
  cleaningtasks: 'RA',
  cleaningchecks: 'RKO',
  cleaningcomplaints: 'RKL',
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

export const emptySite = (): Omit<Site, 'id' | 'number'> => ({
  ...base(),
  name: '',
  shortName: '',
  customerId: '',
  address: emptyAddress(),
  manager: '',
  phone: '',
  email: '',
  status: 'active',
  description: '',
});

export const emptyProperty = (): Omit<Property, 'id' | 'number'> => ({
  ...base(),
  name: '',
  siteId: '',
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
  supplierId: '',
});

export const emptySupplier = (): Omit<Supplier, 'id' | 'number'> => ({
  ...base(),
  name: '',
  contactPerson: '',
  address: emptyAddress(),
  phone: '',
  mobile: '',
  email: '',
  website: '',
  category: '',
  status: 'active',
});

export const emptyDocument = (): Omit<DocumentEntity, 'id' | 'number'> => ({
  ...base(),
  title: '',
  category: '',
  customerId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  assetId: '',
  orderId: '',
  maintenanceId: '',
  validUntil: '',
});

export const emptyEnergyEntry = (): Omit<EnergyEntry, 'id' | 'number'> => ({
  ...base(),
  type: 'electricity',
  typeOther: '',
  propertyId: '',
  buildingId: '',
  month: new Date().toISOString().slice(0, 7),
  unit: 'kWh',
});

export const emptyLegionellaCheck = (): Omit<LegionellaCheck, 'id' | 'number'> => ({
  ...base(),
  title: '',
  propertyId: '',
  buildingId: '',
  system: '',
  measuringPoint: '',
  date: new Date().toISOString().slice(0, 10),
  result: 'pending',
  measures: '',
  responsible: '',
  interval: 'annual',
  nextDate: '',
  samples: [],
});

export const emptyRcdCheck = (): Omit<RcdCheck, 'id' | 'number'> => ({
  ...base(),
  title: '',
  propertyId: '',
  buildingId: '',
  assetId: '',
  distribution: '',
  device: '',
  date: new Date().toISOString().slice(0, 10),
  tester: '',
  result: 'pending',
  status: 'open',
  interval: 'annual',
  nextDate: '',
});

export const emptyKey = (): Omit<KeyEntity, 'id' | 'number'> => ({
  ...base(),
  title: '',
  keyNumber: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  location: '',
  status: 'available',
  issuedTo: '',
  issuedAt: '',
  returnedAt: '',
  movements: [],
});

export const emptyStockItem = (): Omit<StockItem, 'id' | 'number'> => ({
  ...base(),
  title: '',
  articleNumber: '',
  unit: 'Stk',
  location: '',
  supplierId: '',
});

export const emptyContract = (): Omit<ContractEntity, 'id' | 'number'> => ({
  ...base(),
  title: '',
  partner: '',
  supplierId: '',
  customerId: '',
  type: 'maintenance',
  contractNumber: '',
  start: '',
  end: '',
  noticeMonths: '3',
  propertyId: '',
  buildingId: '',
  status: 'active',
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
  quoteId: '',
  supplierId: '',
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
  supplierId: '',
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

export const emptyCleaningArea = (): Omit<CleaningArea, 'id' | 'number'> => ({
  ...base(),
  name: '',
  type: 'office',
  propertyId: '',
  buildingId: '',
  roomId: '',
  location: '',
  responsibleId: '',
  status: 'active',
  description: '',
  checklist: [],
});

export const emptyCleaner = (): Omit<Cleaner, 'id' | 'number'> => ({
  ...base(),
  name: '',
  firstName: '',
  role: 'cleaner',
  phone: '',
  mobile: '',
  email: '',
  supplierId: '',
  status: 'active',
});

export const emptyCleaningPlan = (): Omit<CleaningPlan, 'id' | 'number'> => ({
  ...base(),
  title: '',
  areaId: '',
  cleanerId: '',
  responsibleId: '',
  interval: 'weekly',
  timeStart: '',
  startDate: new Date().toISOString().slice(0, 10),
  nextDate: new Date().toISOString().slice(0, 10),
  status: 'active',
  checklist: [],
});

export const emptyCleaningTask = (): Omit<CleaningTask, 'id' | 'number'> => ({
  ...base(),
  title: '',
  planId: '',
  areaId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  cleanerId: '',
  responsibleId: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'open',
  workStart: '',
  workEnd: '',
  breakMinutes: 0,
  completedAt: '',
  checklist: [],
  materials: [],
});

export const emptyCleaningCheck = (): Omit<CleaningCheck, 'id' | 'number'> => ({
  ...base(),
  title: '',
  areaId: '',
  taskId: '',
  date: new Date().toISOString().slice(0, 10),
  inspectorId: '',
  inspector: '',
  result: 'pending',
  measures: '',
});

export const emptyCleaningComplaint = (): Omit<CleaningComplaint, 'id' | 'number'> => ({
  ...base(),
  title: '',
  areaId: '',
  taskId: '',
  customerId: '',
  propertyId: '',
  buildingId: '',
  roomId: '',
  reportedBy: '',
  reportedAt: new Date().toISOString().slice(0, 10),
  description: '',
  priority: 'medium',
  status: 'open',
  assignedId: '',
  resolution: '',
  resolvedAt: '',
});

const FACTORIES = {
  customers: emptyCustomer,
  suppliers: emptySupplier,
  sites: emptySite,
  properties: emptyProperty,
  buildings: emptyBuilding,
  rooms: emptyRoom,
  assets: emptyAsset,
  documents: emptyDocument,
  energy: emptyEnergyEntry,
  orders: emptyOrder,
  maintenances: emptyMaintenance,
  legionella: emptyLegionellaCheck,
  rcd: emptyRcdCheck,
  keys: emptyKey,
  stock: emptyStockItem,
  contracts: emptyContract,
  damages: emptyDamage,
  reports: emptyReport,
  quotes: emptyQuote,
  invoices: emptyInvoice,
  cleaningareas: emptyCleaningArea,
  cleaners: emptyCleaner,
  cleaningplans: emptyCleaningPlan,
  cleaningtasks: emptyCleaningTask,
  cleaningchecks: emptyCleaningCheck,
  cleaningcomplaints: emptyCleaningComplaint,
} as const;

/** Leerer Datensatz einer Sammlung, noch ohne Kennung und Nummer. */
export const emptyEntity = <K extends CollectionKey>(collection: K) =>
  FACTORIES[collection]() as Omit<EntityOf<K>, 'id' | 'number'>;
