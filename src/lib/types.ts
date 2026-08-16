/**
 * Fachliche Typen von Facility365.
 *
 * Alle Datensaetze teilen sich einen gemeinsamen Kern (Fotos, Dokumente,
 * Historie). Dadurch verhalten sich saemtliche Module gleich und neue Module
 * brauchen nur ihre eigenen Felder zu ergaenzen.
 */

/** Modulschluessel; zugleich Sammlung in der Datenschicht und Teil der Adresse. */
export type ModuleKey =
  | 'dashboard'
  | 'customers'
  | 'properties'
  | 'buildings'
  | 'rooms'
  | 'assets'
  | 'documents'
  | 'orders'
  | 'maintenances'
  | 'damages'
  | 'reports'
  | 'quotes'
  | 'invoices'
  | 'analytics'
  | 'settings';

/** Sammlungen, die Datensaetze fuehren. */
export type CollectionKey = Exclude<ModuleKey, 'dashboard' | 'analytics' | 'settings'>;

export interface Photo {
  id: string;
  /** Bildinhalt als Data-URL. */
  url: string;
  name: string;
  caption?: string;
  takenAt: string;
  size: number;
}

export interface DocumentFile {
  id: string;
  name: string;
  /** Dateiendung in Grossbuchstaben, z. B. PDF. */
  type: string;
  mimeType: string;
  /** Inhalt als Data-URL. */
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  /** Verknuepfter Datensatz, damit das Modul "Dokumente" alles zusammenfuehren kann. */
  linkedModule?: CollectionKey;
  linkedId?: string;
  linkedLabel?: string;
  category?: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  user: string;
  action: string;
}

/** Gemeinsamer Kern jedes Datensatzes. */
export interface BaseEntity {
  id: string;
  /** Fortlaufende, lesbare Nummer, z. B. AUF-0001. */
  number: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  photos: Photo[];
  documents: DocumentFile[];
  history: HistoryEntry[];
}

export type CustomerType = 'company' | 'private';
export type ActiveStatus = 'active' | 'inactive';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  mobile: string;
  email: string;
  primary: boolean;
}

export interface Address {
  street: string;
  zip: string;
  city: string;
  country: string;
}

export interface Contract {
  id: string;
  title: string;
  type: string;
  start: string;
  end: string;
  amount?: number;
  note: string;
}

export interface Customer extends BaseEntity {
  type: CustomerType;
  /** Firmenname oder Nachname der Privatperson. */
  name: string;
  firstName: string;
  address: Address;
  billingAddress?: Address & { name: string };
  phone: string;
  mobile: string;
  email: string;
  website: string;
  status: ActiveStatus;
  contacts: Contact[];
  contracts: Contract[];
}

export type PropertyStatus = 'active' | 'inactive' | 'archived';

export interface Property extends BaseEntity {
  name: string;
  customerId: string;
  address: Address;
  status: PropertyStatus;
  contractStart: string;
  contractEnd: string;
  /** Plaene der ganzen Liegenschaft, z. B. Umgebungs- oder Gartenplan. */
  plans: Plan[];
}

export interface Building extends BaseEntity {
  name: string;
  propertyId: string;
  address: Address;
  yearBuilt: string;
  area?: number;
  status: PropertyStatus;
  description: string;
  floors: BuildingFloor[];
  plans: Plan[];
}

/** Stockwerk eines Gebaeudes. */
export interface BuildingFloor {
  id: string;
  name: string;
  /** Ebene: -1 Untergeschoss, 0 Erdgeschoss, 1 erstes Obergeschoss. */
  level: number;
  area?: number;
  note: string;
}

export interface Room extends BaseEntity {
  name: string;
  roomNumber: string;
  buildingId: string;
  floorId: string;
  type: string;
  area?: number;
  status: ActiveStatus;
  description: string;
}

export type AssetStatus = 'active' | 'maintenance' | 'defect' | 'inactive';

export interface Asset extends BaseEntity {
  name: string;
  category: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  location: string;
  status: AssetStatus;
  /** Baujahr als vierstellige Jahreszahl; leer, wenn unbekannt. */
  manufacturedYear: string;
  installedAt: string;
  /** Garantie bis; leer, wenn keine Garantie erfasst ist. */
  warrantyUntil: string;
  warrantyNote: string;
  maintenanceInterval: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type OrderStatus = 'new' | 'planned' | 'inProgress' | 'paused' | 'done' | 'invoiced';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface Order extends BaseEntity {
  title: string;
  description: string;
  status: OrderStatus;
  priority: Priority;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  /** Offerte, aus der der Auftrag entstanden ist; leer bei freier Erfassung. */
  quoteId: string;
  assignee: string;
  dueDate: string;
  startedAt: string;
  completedAt: string;
  /** Tag der Ausfuehrung; leer, solange nicht gearbeitet wurde. */
  workDate: string;
  /** Arbeitsbeginn als HH:MM. */
  workStart: string;
  /** Arbeitsende als HH:MM. */
  workEnd: string;
  /** Pause in Minuten. */
  breakMinutes: number;
  checklist: ChecklistItem[];
  materials: MaterialItem[];
  signature: string;
  signedBy: string;
}

export type MaintenanceStatus = 'planned' | 'due' | 'overdue' | 'done';
export type MaintenanceInterval =
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'biennial';

export interface Maintenance extends BaseEntity {
  title: string;
  description: string;
  status: MaintenanceStatus;
  interval: MaintenanceInterval;
  propertyId: string;
  buildingId: string;
  assetId: string;
  company: string;
  responsible: string;
  lastDate: string;
  nextDate: string;
  checklist: ChecklistItem[];
}

export type DamageStatus = 'reported' | 'inspection' | 'inProgress' | 'fixed' | 'rejected';

export interface Damage extends BaseEntity {
  title: string;
  description: string;
  status: DamageStatus;
  priority: Priority;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  reportedBy: string;
  reportedAt: string;
  fixedAt: string;
  insuranceCase: boolean;
  estimatedCost?: number;
}

export type ReportType = 'daily' | 'weekly' | 'order' | 'maintenance' | 'damage' | 'inspection';
export type ReportStatus = 'draft' | 'final';

export interface Report extends BaseEntity {
  title: string;
  type: ReportType;
  status: ReportStatus;
  date: string;
  author: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  orderId: string;
  summary: string;
  workDescription: string;
  /** Arbeitsbeginn als HH:MM. */
  workStart: string;
  /** Arbeitsende als HH:MM. */
  workEnd: string;
  /** Pause in Minuten. */
  breakMinutes: number;
  materials: MaterialItem[];
  /** Unterschrift als Data-URL (PNG). */
  signature: string;
  signedBy: string;
  /** Zeitpunkt der Unterschrift als ISO-Zeichenkette. */
  signedAt: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface LineItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  /** Mehrwertsteuersatz in Prozent. */
  vatRate: number;
}

export interface Quote extends BaseEntity {
  title: string;
  status: QuoteStatus;
  customerId: string;
  propertyId: string;
  date: string;
  validUntil: string;
  introText: string;
  items: LineItem[];
  currency: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice extends BaseEntity {
  title: string;
  status: InvoiceStatus;
  customerId: string;
  propertyId: string;
  orderId: string;
  quoteId: string;
  /** Rapport, aus dem die Rechnung erstellt wurde; leer bei freier Erfassung. */
  reportId: string;
  date: string;
  dueDate: string;
  paidAt: string;
  items: LineItem[];
  currency: string;
  /** Schweizer QR-Referenz; bleibt leer, solange keine Bankdaten erfasst sind. */
  qrReference: string;
}

/** Eigenstaendiger Dokumenteneintrag des Moduls "Dokumente". */
export interface DocumentEntity extends BaseEntity {
  title: string;
  category: string;
  file?: DocumentFile;
  customerId: string;
  propertyId: string;
  buildingId: string;
  assetId: string;
  validUntil: string;
}

/** Plantypen der Gebaeude- und Liegenschaftsplaene. */
export type PlanType =
  | 'floorPlan'
  | 'escape'
  | 'fire'
  | 'electric'
  | 'plumbing'
  | 'heating'
  | 'ventilation'
  | 'roof'
  | 'garden'
  | 'other';

export interface PlanVersion {
  id: string;
  /** Fortlaufend ab 1. */
  version: number;
  fileName: string;
  mimeType: string;
  /** Inhalt als Data-URL. */
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  note: string;
}

/**
 * Markierung einer Anlage auf einem Plan.
 *
 * Die Position wird in Prozent der Plangroesse gespeichert und liegt damit auf
 * jedem Bildschirm und in jeder Zoomstufe an derselben Stelle.
 */
export interface PlanMarker {
  id: string;
  /** Position 0-100 in Prozent. */
  x: number;
  y: number;
  assetId: string;
  label: string;
  note: string;
  /** Seite eines mehrseitigen PDF-Plans. */
  page?: number;
}

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  /** Stockwerk, auf das sich der Plan bezieht. */
  floorId: string;
  versions: PlanVersion[];
  /** Angezeigte Fassung; leer = neueste. */
  currentVersionId: string;
  markers: PlanMarker[];
  createdAt: string;
}

export type Language = 'de' | 'fr' | 'it' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  companyName: string;
  companyLogo: string;
  companyAddress: Address;
  companyPhone: string;
  companyEmail: string;
  companyVat: string;
  language: Language;
  theme: ThemeMode;
  profileName: string;
  profileEmail: string;
  profileRole: string;
  currency: string;
  hourlyRate?: number;
  vatRate: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

/** Zuordnung von Sammlung zu Datensatztyp. */
export interface CollectionMap {
  customers: Customer;
  properties: Property;
  buildings: Building;
  rooms: Room;
  assets: Asset;
  documents: DocumentEntity;
  orders: Order;
  maintenances: Maintenance;
  damages: Damage;
  reports: Report;
  quotes: Quote;
  invoices: Invoice;
}

export type EntityOf<K extends CollectionKey> = CollectionMap[K];
