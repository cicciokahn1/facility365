/**
 * Fachliche Typen von Facility365.
 *
 * Alle Datensaetze teilen sich einen gemeinsamen Kern (Fotos, Dokumente,
 * Historie). Dadurch verhalten sich saemtliche Module gleich und neue Module
 * brauchen nur ihre eigenen Felder zu ergaenzen.
 */

/** Modulschluessel; zugleich Sammlung in der Datenschicht und Teil der Adresse. */
export type ModuleKey =
  | "dashboard"
  | "calendar"
  | "appointments"
  | "customers"
  | "suppliers"
  | "sources"
  | "organizations"
  | "sites"
  | "properties"
  | "buildings"
  | "plans"
  | "rooms"
  | "assets"
  | "documents"
  | "energy"
  | "solarplants"
  | "solaryields"
  | "orders"
  | "maintenances"
  | "legionella"
  | "rcd"
  | "inspections"
  | "playgroundchecks"
  | "firechecks"
  | "keys"
  | "inventory"
  | "vehicles"
  | "tools"
  | "visitors"
  | "parking"
  | "waste"
  | "stock"
  | "contracts"
  | "damages"
  | "tickets"
  | "reports"
  | "quotes"
  | "invoices"
  | "cleaning"
  | "cleaningareas"
  | "cleaners"
  | "cleaningplans"
  | "cleaningtasks"
  | "cleaningchecks"
  | "cleaningcomplaints"
  | "analytics"
  | "audit"
  | "walkthrough"
  | "handover"
  | "portal"
  | "today"
  | "favorites"
  | "microsoft"
  | "users"
  | "activities"
  | "trash"
  | "help"
  | "settings"
  | "myArea"
  | "privateNotes"
  | "privateFiles";

/** Sammlungen, die Datensaetze fuehren. */
export type CollectionKey = Exclude<
  ModuleKey,
  | "dashboard"
  | "calendar"
  | "myArea"
  | "plans"
  | "cleaning"
  | "analytics"
  | "audit"
  | "walkthrough"
  | "handover"
  | "portal"
  | "today"
  | "favorites"
  | "microsoft"
  | "trash"
  | "help"
  | "settings"
>;

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

export interface PrivateNote extends BaseEntity {
  title: string;
  content: string;
  folder: string;
}

export interface PrivateFile extends BaseEntity {
  name: string;
  folder: string;
  parentFolder?: string;
  isFolder?: boolean;
  mimeType: string;
  url: string;
  size: number;
  uploadedAt: string;
}

/** Einzelne Feldaenderung: Bezeichnung des Feldes, alter und neuer Wert. */
export interface FieldChange {
  /** Uebersetzungsschluessel der Feldbezeichnung. */
  labelKey: string;
  /** Werte als Text; bei Auswahlfeldern der Uebersetzungsschluessel. */
  from: string;
  to: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  user: string;
  action: string;
  /** Was sich geaendert hat; fehlt bei Anlage und Loeschung. */
  changes?: FieldChange[];
}

/** Gemeinsamer Kern jedes Datensatzes. */
export interface BaseEntity {
  id: string;
  /** Fortlaufende, lesbare Nummer, z. B. AUF-0001. */
  number: string;
  createdAt: string;
  updatedAt: string;
  /** Datum des letzten fachlichen Abschlusses, sofern vorhanden. */
  completedAt?: string;
  notes: string;
  photos: Photo[];
  documents: DocumentFile[];
  history: HistoryEntry[];
  /** Gesetzt, solange der Datensatz im Papierkorb liegt. */
  deletedAt?: string;
}

export type CustomerType = "company" | "private";
export type ActiveStatus = "active" | "inactive";

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

/** Lieferant oder Dienstleister, z. B. Heizungsservice oder Materialhandel. */
export interface Supplier extends BaseEntity {
  name: string;
  contactPerson: string;
  address: Address;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  category: string;
  status: ActiveStatus;
  /** Individueller Verrechnungssatz für externe Leistungen. */
  hourlyRate?: number;
}

export type AppointmentStatus = "planned" | "done" | "cancelled";

/**
 * Termin des Kalenders.
 *
 * Eigener Eintrag, der direkt im Kalender angelegt, bearbeitet und geloescht
 * wird. Die abgeleiteten Termine aus Auftraegen, Wartungen und Kontrollen
 * bleiben daneben unveraendert bestehen.
 */
export interface Appointment extends BaseEntity {
  title: string;
  type: string;
  status: AppointmentStatus;
  date: string;
  /** Uhrzeiten als HH:MM; leer, wenn nur der Tag feststeht. */
  timeStart: string;
  timeEnd: string;
  /** Pause in Minuten fuer den Arbeitsplan. */
  breakMinutes?: number;
  /** Kennzeichnet einen Einsatz als woechentlich wiederholbar. */
  weeklyRepeat?: boolean;
  location: string;
  assignee: string;
  assigneeUserId: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  description: string;
}

/**
 * Bezugsquelle.
 *
 * Selbst gepflegter Anbieter, bei dem Material, Werkzeug oder Ersatzteile
 * bezogen werden. Kann mit einem Lieferanten und mit Inventar verknuepft
 * werden, ersetzt die Lieferanten aber nicht.
 */
export interface Source extends BaseEntity {
  name: string;
  category: string;
  website: string;
  contactPerson: string;
  phone: string;
  mobile: string;
  email: string;
  address: Address;
  /** Persoenliche Bewertung von 1 bis 5; leer, solange nicht bewertet. */
  rating: string;
  supplierId: string;
  status: ActiveStatus;
}

export type PropertyStatus = "active" | "inactive" | "archived";

/**
 * Organisation.
 *
 * Oberste Ebene der Objektstruktur: Organisation → Standort → Liegenschaft →
 * Gebaeude → Raum → Anlage. Standorte ohne Organisation bleiben gueltig.
 */
export interface Organization extends BaseEntity {
  name: string;
  shortName: string;
  address: Address;
  manager: string;
  phone: string;
  email: string;
  website: string;
  status: PropertyStatus;
  description: string;
}

/**
 * Standort einer Organisation.
 *
 * Liegenschaften ohne Standort bleiben gueltig und erscheinen in der Uebersicht
 * als nicht zugeordnet.
 */
export interface Site extends BaseEntity {
  name: string;
  shortName: string;
  organizationId: string;
  customerId: string;
  address: Address;
  manager: string;
  phone: string;
  email: string;
  status: PropertyStatus;
  description: string;
}

export interface Property extends BaseEntity {
  name: string;
  siteId: string;
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
  conditionStatus?: AssetConditionStatus;
  renewalRequired?: boolean;
  renewalCost?: number;
  plannedRenewalYear?: string;
  renewalPriority?: Priority;
  responsible?: string;
  conditionNote?: string;
}

/** Stockwerk eines Gebaeudes. */
export interface BuildingFloor {
  id: string;
  name: string;
  /** Ebene: -1 Untergeschoss, 0 Erdgeschoss, 1 erstes Obergeschoss. */
  level: number;
  area?: number;
  /** SIA-416-nahe Teilflaechen in m². */
  grossArea?: number;
  netArea?: number;
  usableArea?: number;
  trafficArea?: number;
  functionalArea?: number;
  secondaryArea?: number;
  /** Energiebezugsflaeche nach SIA 380 in m². */
  energyReferenceArea?: number;
  note: string;
}

export type Sia416AreaType =
  | "NF"
  | "HNF"
  | "NNF"
  | "VF"
  | "FF"
  | "KF"
  | "GF";

export interface Room extends BaseEntity {
  name: string;
  roomNumber: string;
  buildingId: string;
  floorId: string;
  type: string;
  area?: number;
  sia416AreaType?: Sia416AreaType;
  /** Nutzungsart nach DIN 277. */
  din277AreaType?: "NUF" | "TF" | "VF" | "KGF" | "BGF";
  /** Anzahl Arbeitsplaetze im Raum. */
  workplaces?: number;
  workplaceList?: {
    id: string;
    code: string;
    occupant: string;
    status: "free" | "occupied" | "reserved";
  }[];
  /** Nutzer, Abteilung oder Mieter des Raums. */
  occupant?: string;
  status: ActiveStatus;
  description: string;
  conditionStatus?: AssetConditionStatus;
  renewalRequired?: boolean;
  renewalCost?: number;
  plannedRenewalYear?: string;
  renewalPriority?: Priority;
  responsible?: string;
  conditionNote?: string;
}

export type AssetStatus = "active" | "maintenance" | "defect" | "inactive";
export type AssetConditionStatus = "new" | "good" | "watch" | "critical" | "outOfService";
export type AssetLifecycle =
  | "planned"
  | "inOperation"
  | "maintained"
  | "retired"
  | "disposed";

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
  conditionStatus?: AssetConditionStatus;
  /** Baujahr als vierstellige Jahreszahl; leer, wenn unbekannt. */
  manufacturedYear: string;
  installedAt: string;
  acquisitionCost?: number;
  expectedLifetimeYears?: number;
  responsible?: string;
  /** Garantie bis; leer, wenn keine Garantie erfasst ist. */
  warrantyUntil: string;
  warrantyNote: string;
  maintenanceInterval: string;
  /** Lieferant oder Servicepartner der Anlage. */
  supplierId: string;
  parentAssetId?: string;
  relatedAssetIds?: string[];
  lifecycle?: AssetLifecycle;
  decommissionedAt?: string;
  contractId?: string;
  costCenter?: string;
  criticality?: "low" | "medium" | "high";
  locationHistory?: {
    id: string;
    date: string;
    buildingId: string;
    roomId: string;
    location: string;
    note: string;
  }[];
  conditionRating?: 1 | 2 | 3 | 4 | 5;
  conditionAssessedAt?: string;
  conditionNote?: string;
  replacementCost?: number;
  plannedReplacementYear?: string;
  renewalRequired?: boolean;
  renewalPriority?: Priority;
  /** Optionale anlagenspezifische Erweiterungen der technischen Checkliste. */
  technicalChecklist?: TechnicalCheckpointDefinition[];
}

export type EnergyType =
  | "electricity"
  | "water"
  | "oil"
  | "gas"
  | "pellets"
  | "districtHeating"
  | "wood"
  | "solar"
  | "heatPump"
  | "other";

/** Verbrauch eines Monats fuer eine Liegenschaft oder ein Gebaeude. */
export interface EnergyEntry extends BaseEntity {
  type: EnergyType;
  /** Eigene Bezeichnung, wenn die Art "Sonstiges" ist. */
  typeOther: string;
  propertyId: string;
  buildingId: string;
  /** Monat als YYYY-MM. */
  month: string;
  consumption?: number;
  unit: string;
  cost?: number;
}

/** Stand einer Photovoltaikanlage. */
export type SolarPlantStatus = "planned" | "active" | "inactive";

/** Photovoltaikanlage einer Liegenschaft. */
export interface SolarPlant extends BaseEntity {
  name: string;
  status: SolarPlantStatus;
  propertyId: string;
  buildingId: string;
  /** Verknuepfte technische Anlage, damit Wartung und Historie zusammenlaufen. */
  assetId: string;
  /** Leistung in Kilowatt-Peak. */
  power?: number;
  /** Datum der Inbetriebnahme. */
  commissionedAt: string;
  /** Anzahl Module. */
  moduleCount?: number;
  moduleType: string;
  orientation: string;
  inverter: string;
  inverterCount?: number;
  /** Speicherkapazitaet in Kilowattstunden; 0 oder leer bedeutet kein Speicher. */
  batteryCapacity?: number;
  batteryType: string;
  supplierId: string;
  /** Verguetung je eingespeiste Kilowattstunde. */
  feedInTariff?: number;
  /** Strompreis je Kilowattstunde fuer die Bewertung des Eigenverbrauchs. */
  electricityPrice?: number;
  /** Gramm CO2 je Kilowattstunde, die durch Solarstrom vermieden werden. */
  co2Factor?: number;
  investment?: number;
  nextMaintenance: string;
}

/** Monatswerte einer Photovoltaikanlage. */
export interface SolarYield extends BaseEntity {
  plantId: string;
  /** Monat als YYYY-MM. */
  month: string;
  /** Erzeugte Energie in Kilowattstunden. */
  production?: number;
  /** Direkt genutzte Energie in Kilowattstunden. */
  selfUse?: number;
  /** Ins Netz abgegebene Energie in Kilowattstunden. */
  feedIn?: number;
  /** Aus dem Speicher entnommene Energie in Kilowattstunden. */
  batteryUse?: number;
  /** Verguetung der Einspeisung. */
  revenue?: number;
  /** Eingesparte Stromkosten durch Eigenverbrauch. */
  savings?: number;
  /** Betriebskosten des Monats. */
  cost?: number;
}

/** Artikel der Lagerverwaltung. */
export interface StockItem extends BaseEntity {
  /** Bezeichnung des Materials. */
  title: string;
  articleNumber: string;
  quantity?: number;
  minQuantity?: number;
  unit: string;
  /** Lagerort, z. B. Regal oder Fahrzeug. */
  location: string;
  supplierId: string;
  price?: number;
}

/** Stand eines Vertrags. */
export type ContractStatus = "active" | "terminated" | "expired";

/** Vertrag der Vertragsverwaltung. */
export interface ContractEntity extends BaseEntity {
  title: string;
  /** Vertragspartner, z. B. Firma oder Person. */
  partner: string;
  supplierId: string;
  customerId: string;
  /** Vertragsart, z. B. Wartungsvertrag. */
  type: string;
  contractNumber: string;
  start: string;
  end: string;
  /** Kuendigungsfrist in Monaten vor Vertragsende. */
  noticeMonths: string;
  cost?: number;
  /** Zustaendiger Standort. */
  propertyId: string;
  buildingId: string;
  status: ContractStatus;
}

export type Priority = "low" | "medium" | "high" | "critical";

export type OrderStatus =
  "new" | "planned" | "inProgress" | "paused" | "done" | "invoiced";

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
  /** Lagerartikel, aus dem die Position übernommen wurde. */
  stockItemId?: string;
  billable?: boolean;
  invoicedAt?: string;
  invoicedInvoiceId?: string;
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
  vehicleId?: string;
  toolId?: string;
  /** Offerte, aus der der Auftrag entstanden ist; leer bei freier Erfassung. */
  quoteId: string;
  /** Beauftragter Lieferant oder Dienstleister. */
  supplierId: string;
  assignee: string;
  /** Zustaendige Benutzerin oder Benutzer aus der Benutzerverwaltung. */
  assigneeUserId: string;
  /** Zustaendiges Team; frei benannt, z. B. «Hauswartung Nord». */
  assigneeTeam: string;
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
  externalServices?: MaterialItem[];
  signature: string;
  signedBy: string;
  /** Modul, aus dem der Auftrag entstanden ist, z. B. eine Kontrolle. */
  sourceCollection?: CollectionKey;
  /** Datensatz, aus dem der Auftrag entstanden ist. */
  sourceId?: string;
  /** Nachricht aus Outlook, aus der der Auftrag entstanden ist. */
  graphMessageId?: string;
  /** Zugehoeriger Termin im Outlook-Kalender. */
  graphEventId?: string;
  /** Zeitpunkt des letzten Abgleichs mit Microsoft 365. */
  graphSyncedAt?: string;
  hourlyRate?: number;
}

export type MaintenanceStatus = "planned" | "due" | "overdue" | "done";
export type MaintenanceInterval =
  "monthly" | "quarterly" | "semiannual" | "annual" | "biennial";

export interface Maintenance extends BaseEntity {
  title: string;
  description: string;
  status: MaintenanceStatus;
  interval: MaintenanceInterval;
  propertyId: string;
  buildingId: string;
  assetId: string;
  vehicleId?: string;
  toolId?: string;
  company: string;
  supplierId: string;
  responsible: string;
  assigneeUserId: string;
  assigneeTeam: string;
  lastDate: string;
  nextDate: string;
  checklist: ChecklistItem[];
  legalBasis?: string;
  dutyCategory?: string;
}

/** Bewertung einer Legionellenkontrolle. */
export type LegionellaResult = "pending" | "ok" | "warning" | "critical";

/** Einzelne Messstelle einer Kontrolle. */
export interface LegionellaSample {
  id: string;
  point: string;
  /** Warmwasser in Grad Celsius. */
  hotTemp?: number;
  /** Kaltwasser in Grad Celsius. */
  coldTemp?: number;
  /** Legionellen in KBE je Liter. */
  cfu?: number;
  note: string;
}

/** Kontrolle einer Wasseranlage auf Legionellen. */
export interface LegionellaCheck extends BaseEntity {
  title: string;
  propertyId: string;
  buildingId: string;
  /** Wasseranlage, z. B. Boiler Ost oder Zirkulation Steigzone A. */
  system: string;
  /** Leitende Messstelle; weitere Stellen stehen in samples. */
  measuringPoint: string;
  date: string;
  hotTemp?: number;
  coldTemp?: number;
  cfu?: number;
  result: LegionellaResult;
  measures: string;
  responsible: string;
  interval: MaintenanceInterval;
  nextDate: string;
  samples: LegionellaSample[];
  /** Laborbericht als PDF. */
  labReport?: DocumentFile;
}

/** Stand einer FI-Kontrolle. */
export type RcdStatus = "open" | "done";

/** Ergebnis einer FI-Kontrolle. */
export type RcdResult = "pending" | "passed" | "failed";

/** Pruefung eines Fehlerstromschutzschalters (FI/RCD). */
export interface RcdCheck extends BaseEntity {
  title: string;
  propertyId: string;
  buildingId: string;
  assetId: string;
  /** Verteiler oder Unterverteilung. */
  distribution: string;
  /** Bezeichnung des FI/RCD, z. B. FI 1 Steigzone A. */
  device: string;
  date: string;
  tester: string;
  /** Bemessungsdifferenzstrom in mA. */
  ratedCurrent?: number;
  /** Gemessener Ausloesestrom in mA. */
  tripCurrent?: number;
  /** Gemessene Ausloesezeit in ms. */
  tripTime?: number;
  result: RcdResult;
  status: RcdStatus;
  interval: MaintenanceInterval;
  nextDate: string;
}

/** Art einer Kontrolle; frei erweiterbar ueber 'custom'. */
export type InspectionType =
  | "fire"
  | "emergencyLight"
  | "escapeRoute"
  | "safety"
  | "elevator"
  | "ladder"
  | "playground"
  | "custom";

/** Wiederkehrende Kontrolle der Betreiberpflichten. */
export interface Inspection extends BaseEntity {
  title: string;
  type: InspectionType;
  /** Eigene Bezeichnung, wenn die Art 'custom' ist. */
  customType: string;
  organizationId: string;
  siteId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  date: string;
  tester: string;
  supplierId: string;
  assigneeUserId: string;
  assigneeTeam: string;
  interval: MaintenanceInterval;
  nextDate: string;
  result: RcdResult;
  status: RcdStatus;
  measures: string;
  legalBasis?: string;
  dutyCategory?: string;
  /** Kontrollpunkte und Messwerte eines technischen Rundgangs. */
  technicalCategory?: string;
  technicalCheckpoints?: TechnicalCheckpointResult[];
  technicalMeasurements?: Record<string, string>;
  previousMeasurements?: Record<string, string>;
}

export interface TechnicalCheckpointResult {
  key: string;
  label: string;
  value: string;
  target?: string;
  unit?: string;
  status: "ok" | "attention" | "notChecked";
}

export interface TechnicalCheckpointDefinition {
  key: string;
  label: string;
  kind: "status" | "measurement" | "note";
  unit?: string;
  target?: string;
}

/** Art einer Spielplatzkontrolle. */
export type PlaygroundCheckType = "visual" | "functional" | "periodic";

/** Zustand eines Spielplatzes nach der Kontrolle. */
export type PlaygroundCondition = "good" | "minor" | "defect" | "closed";

/** Kontrolle eines Spielplatzes nach Sicht-, Funktions- oder Hauptpruefung. */
export interface PlaygroundCheck extends BaseEntity {
  /** Name des Spielplatzes. */
  title: string;
  type: PlaygroundCheckType;
  organizationId: string;
  siteId: string;
  propertyId: string;
  buildingId: string;
  /** Freie Ortsangabe, z. B. Pausenplatz Nord. */
  location: string;
  date: string;
  /** Person, welche die Kontrolle ausgefuehrt hat. */
  inspector: string;
  supplierId: string;
  assigneeUserId: string;
  assigneeTeam: string;
  condition: PlaygroundCondition;
  /** Festgestellte Maengel im Klartext. */
  defects: string;
  measures: string;
  interval: MaintenanceInterval;
  nextDate: string;
  status: RcdStatus;
  /** Schaden, der aus den Maengeln erstellt wurde. */
  damageId: string;
  /** Auftrag, der aus den Maengeln erstellt wurde. */
  orderId: string;
}

/** Geprueftes Brandschutzelement; frei erweiterbar ueber 'custom'. */
export type FireCheckType =
  | "extinguisher"
  | "alarm"
  | "escapeRoute"
  | "emergencyExit"
  | "fireDoor"
  | "smokeExtraction"
  | "extinguishingWater"
  | "signage"
  | "firing"
  | "custom";

/** Brennstoff einer Feuerungsanlage. */
export type FiringFuel =
  "oil" | "gas" | "wood" | "pellets" | "woodchips" | "heatpump" | "other";

/** Umfang der Feuerungskontrolle durch den Kaminfeger. */
export type FiringScope = "cleaning" | "measurement" | "safety" | "periodic";

/** Zustand eines Brandschutzelements nach der Kontrolle. */
export type FireCheckCondition = "good" | "minor" | "defect" | "critical";

/** Kontrolle einer Brandschutzeinrichtung. */
export interface FireCheck extends BaseEntity {
  /** Bezeichnung der Kontrolle. */
  title: string;
  type: FireCheckType;
  /** Eigene Bezeichnung, wenn die Art 'custom' ist. */
  customType: string;
  organizationId: string;
  siteId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  /** Freie Bereichsangabe, z. B. Treppenhaus Ost. */
  area: string;
  date: string;
  /** Person, welche die Kontrolle ausgefuehrt hat. */
  inspector: string;
  supplierId: string;
  /** Verantwortliche Person fuer die Behebung. */
  assigneeUserId: string;
  assigneeTeam: string;
  condition: FireCheckCondition;
  /** Bezeichnung der Feuerungsanlage (Feuerungskontrolle). */
  firingSystem: string;
  fuel: FiringFuel;
  /** Kaminfeger oder Kaminfegerbetrieb. */
  sweeper: string;
  firingScope: FiringScope;
  /** Kohlenmonoxid in ppm. */
  coValue: number;
  /** Russzahl nach Bacharach. */
  sootNumber: number;
  /** Abgastemperatur in Grad Celsius. */
  exhaustTemperature: number;
  /** Feuerungswirkungsgrad in Prozent. */
  efficiency: number;
  /** Weitere Messwerte im Klartext. */
  measurements: string;
  /** Festgestellte Maengel im Klartext. */
  defects: string;
  measures: string;
  /** Frist fuer die Behebung der Maengel. */
  dueDate: string;
  interval: MaintenanceInterval;
  nextDate: string;
  status: RcdStatus;
  /** Schaden, der aus den Maengeln erstellt wurde. */
  damageId: string;
  /** Auftrag, der aus den Maengeln erstellt wurde. */
  orderId: string;
}

/** Stand eines Schluessels. */
export type KeyStatus = "available" | "issued" | "lost" | "retired";

/** Ausgabe oder Ruecknahme eines Schluessels. */
export interface KeyMovement {
  id: string;
  type: "issue" | "return";
  date: string;
  /** Person oder Firma, die den Schluessel erhalten oder zurueckgegeben hat. */
  person: string;
  note: string;
}

/** Schluessel der Schluesselverwaltung. */
/** Gemeinsame Felder von Gegenstaenden, die ausgegeben und zurueckgenommen werden. */
export interface Issuable {
  status: KeyStatus;
  /** Aktuell ausgegeben an. */
  issuedTo: string;
  issuedAt: string;
  returnedAt: string;
  /** Alle Ausgaben und Ruecknahmen. */
  movements: KeyMovement[];
}

export interface KeyEntity extends BaseEntity, Issuable {
  title: string;
  /** Aufgedruckte oder eigene Schluesselnummer. */
  keyNumber: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  /** Aufbewahrungsort, z. B. Schluesselschrank. */
  location: string;
}

/** Zustand eines Inventar- oder Werkzeugbestands. */
export type ConditionStatus = "new" | "good" | "used" | "defect" | "disposed";

/** Inventargegenstand mit Inventarnummer und QR-Code. */
export interface InventoryItem extends BaseEntity {
  title: string;
  /** Eigene Inventarnummer, zusaetzlich zur laufenden Nummer. */
  inventoryNumber: string;
  category: string;
  organizationId: string;
  siteId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  /** Genauer Aufbewahrungsort im Raum. */
  location: string;
  manufacturer: string;
  model: string;
  serial: string;
  condition: ConditionStatus;
  purchaseDate: string;
  price?: number;
  supplierId: string;
  /** Bezugsquelle, bei der der Gegenstand beschafft wurde. */
  sourceId: string;
  warrantyUntil: string;
}

/** Stand eines Fahrzeugs. */
export type VehicleStatus = "active" | "service" | "retired";
export type VehicleServiceType =
  | "maintenance"
  | "tireChange"
  | "inspection"
  | "repair";

export interface VehicleInspection {
  id: string;
  date: string;
  inspector: string;
  result: "ok" | "defect" | "pending";
  checklist: ChecklistItem[];
  note: string;
}

export interface VehicleHandover {
  id: string;
  date: string;
  type: "handover" | "return";
  person: string;
  mileage?: number;
  operatingHours?: number;
  note: string;
}

/** Firmenfahrzeug mit Service-, Reifen- und Pruefterminen. */
export interface Vehicle extends BaseEntity {
  title: string;
  /** Kontrollschild. */
  plate: string;
  brand: string;
  model: string;
  year: string;
  vin: string;
  status: VehicleStatus;
  /** Kilometerstand. */
  mileage?: number;
  /** Betriebsstunden, sofern das Fahrzeug zusaetzlich als Arbeitsmaschine dient. */
  operatingHours?: number;
  fuelType?: string;
  fuelConsumption?: number;
  fuelUnit?: string;
  serviceIntervalMonths?: number;
  serviceIntervalKm?: number;
  serviceIntervalHours?: number;
  lastServiceHours?: number;
  licenseRequirements?: string;
  inspectionChecklist?: ChecklistItem[];
  inspections?: VehicleInspection[];
  handovers?: VehicleHandover[];
  driver: string;
  assigneeUserId: string;
  siteId: string;
  propertyId: string;
  nextService: string;
  /** Art des zuletzt erfassten Fahrzeugservices. */
  serviceType: VehicleServiceType;
  /** Datum des zuletzt erfassten Fahrzeugservices. */
  lastService: string;
  /** Ausfuehrende Garage oder Servicefirma. */
  serviceProvider: string;
  /** Kosten des zuletzt erfassten Fahrzeugservices. */
  serviceCost?: number;
  /** Naechster Reifenwechsel. */
  tireChange: string;
  /** Naechste amtliche Pruefung (MFK). */
  nextInspection: string;
  insurer: string;
  policyNumber: string;
  insuranceUntil: string;
}

export type VisitorStatus = "expected" | "present" | "completed" | "cancelled";

/** Besuch oder Zutritt mit Objektbezug und Ein-/Austrittszeit. */
export interface Visitor extends BaseEntity {
  visitorName: string;
  company: string;
  phone: string;
  email: string;
  purpose: string;
  propertyId: string;
  buildingId: string;
  hostUserId: string;
  vehiclePlate: string;
  badge: string;
  status: VisitorStatus;
  checkIn: string;
  checkOut: string;
}

export type ParkingStatus = "available" | "occupied" | "reserved" | "blocked";

/** Parkplatz mit Standort, Zuordnung und Gültigkeit. */
export interface ParkingSpace extends BaseEntity {
  title: string;
  code: string;
  propertyId: string;
  buildingId: string;
  location: string;
  type: string;
  status: ParkingStatus;
  assignedTo: string;
  plate: string;
  validFrom: string;
  validUntil: string;
}

export type WasteStatus = "active" | "paused" | "completed";

/** Abfallstelle mit Abholrhythmus und verantwortlicher Person/Firma. */
export interface WasteEntry extends BaseEntity {
  title: string;
  wasteType: string;
  propertyId: string;
  buildingId: string;
  location: string;
  container: string;
  supplierId: string;
  interval: string;
  nextPickup: string;
  status: WasteStatus;
  responsibleId: string;
}

/** Werkzeug oder Geraet, das ausgegeben und zurueckgenommen wird. */
export interface Tool extends BaseEntity, Issuable {
  title: string;
  /** Eigene Werkzeugnummer. */
  toolNumber: string;
  category: string;
  manufacturer: string;
  serial: string;
  condition: ConditionStatus;
  propertyId: string;
  buildingId: string;
  /** Aufbewahrungsort, z. B. Werkstatt. */
  location: string;
  nextCheck: string;
  /** Betriebsstunden fuer Maschinen und motorisierte Geraete. */
  operatingHours?: number;
  fuelType?: string;
  fuelConsumption?: number;
  fuelUnit?: string;
  lastService?: string;
  nextService?: string;
  serviceCost?: number;
  serviceProvider?: string;
  serviceIntervalHours?: number;
  licenseRequirements?: string;
  inspectionChecklist?: ChecklistItem[];
  inspections?: VehicleInspection[];
  handovers?: VehicleHandover[];
}

export type DamageStatus =
  "reported" | "inspection" | "inProgress" | "fixed" | "rejected";

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
  vehicleId?: string;
  toolId?: string;
  reportedBy: string;
  /** Melderin oder Melder aus der Benutzerverwaltung. */
  reportedById: string;
  assigneeUserId: string;
  assigneeTeam: string;
  reportedAt: string;
  fixedAt: string;
  insuranceCase: boolean;
  estimatedCost?: number;
}

/** Helpdesk: Bearbeitungsstand einer Meldung. */
export type TicketStatus = "new" | "inProgress" | "waiting" | "done" | "closed";

export type TicketCategory =
  "fault" | "damage" | "cleaning" | "request" | "question" | "other";

/** Wortmeldung im Verlauf eines Tickets. */
export interface TicketComment {
  id: string;
  at: string;
  author: string;
  text: string;
}

export interface Ticket extends BaseEntity {
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: Priority;
  customerId: string;
  organizationId: string;
  siteId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  reportedBy: string;
  reportedById: string;
  assigneeUserId: string;
  reportedAt: string;
  /** Frist; ueberschritten gilt das Ticket als ueberfaellig. */
  dueDate: string;
  closedAt: string;
  /** Auftrag, der aus dem Ticket entstanden ist. */
  orderId: string;
  damageId: string;
  maintenanceId: string;
  reportId: string;
  comments: TicketComment[];
  /** Modul, aus dem die Meldung entstanden ist, z. B. eine Kontrolle. */
  sourceCollection?: CollectionKey;
  /** Datensatz, aus dem die Meldung entstanden ist. */
  sourceId?: string;
}

export type ReportType =
  "daily" | "weekly" | "order" | "maintenance" | "damage" | "inspection";
export type ReportStatus = "draft" | "final";

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
  vehicleId?: string;
  toolId?: string;
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
  externalServices?: MaterialItem[];
  /** Im Kundenportal sichtbar; ohne Freigabe bleibt der Rapport intern. */
  sharedWithCustomer: boolean;
  /** Unterschrift als Data-URL (PNG). */
  signature: string;
  signedBy: string;
  /** Zeitpunkt der Unterschrift als ISO-Zeichenkette. */
  signedAt: string;
  billable?: boolean;
  invoicedAt?: string;
  invoicedInvoiceId?: string;
  hourlyRate?: number;
}

export type QuoteStatus =
  "draft" | "sent" | "accepted" | "rejected" | "expired";

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

export type InvoiceReferenceType = "QRR" | "SCOR";

export interface InvoicePaymentData {
  recipient: string;
  address: Address;
  iban: string;
  qrIban: string;
  bank: string;
  bic: string;
  referenceType: InvoiceReferenceType;
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

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

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
  /** Zum Zeitpunkt der Rechnung gespeicherte Zahlungsdaten des Zahlungsempfängers. */
  payment?: InvoicePaymentData;
}

/** Eigenstaendiger Dokumenteneintrag des Moduls "Dokumente". */
/** Frühere Fassung eines Dokuments. */
export interface DocumentVersion {
  id: string;
  /** Fortlaufende Fassungsnummer, beginnend bei 1. */
  version: number;
  file: DocumentFile;
  /** Grund oder Aenderungshinweis zur Fassung. */
  note: string;
  replacedAt: string;
  replacedBy: string;
}

export interface DocumentEntity extends BaseEntity {
  title: string;
  category: string;
  file?: DocumentFile;
  /** Frühere Fassungen; die aktuelle Fassung steht in `file`. */
  versions: DocumentVersion[];
  organizationId: string;
  siteId: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  assetId: string;
  orderId: string;
  maintenanceId: string;
  validUntil: string;
  /** Im Kundenportal sichtbar; ohne Freigabe bleibt das Dokument intern. */
  sharedWithCustomer: boolean;
  safetyEvidence?: boolean;
}

/** Rolle einer Person der Reinigung. */
export type CleanerRole = "cleaner" | "lead" | "caretaker" | "external";

/** Reinigungskraft, Reinigungsleitung oder Hauswart. */
export interface Cleaner extends BaseEntity {
  name: string;
  firstName: string;
  role: CleanerRole;
  phone: string;
  mobile: string;
  email: string;
  /** Externe Reinigungsfirma; leer bei eigenem Personal. */
  supplierId: string;
  status: ActiveStatus;
  /** Individueller Verrechnungssatz; der Rollenansatz dient als Fallback. */
  hourlyRate?: number;
}

/**
 * Reinigungsbereich.
 *
 * Ein Bereich beschreibt, was gereinigt wird: ein ganzes Gebaeude, ein
 * Stockwerk oder ein einzelner Raum. Die Checkliste dient als Vorlage fuer
 * jede Aufgabe des Bereichs.
 */
export interface CleaningArea extends BaseEntity {
  name: string;
  /** Art des Bereichs, z. B. Treppenhaus oder Sanitaer. */
  type: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  /** Stockwerk oder naehere Ortsangabe. */
  location: string;
  area?: number;
  floorCovering?: string;
  minutesPer100m2?: number;
  /** Verantwortliche Person der Reinigung. */
  responsibleId: string;
  status: ActiveStatus;
  description: string;
  /** Standard-Checkliste des Bereichs. */
  checklist: ChecklistItem[];
}

/** Reinigungsintervall; "custom" rechnet mit einer eigenen Anzahl Tage. */
export type CleaningInterval =
  "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "custom";

export type CleaningPlanStatus = "active" | "paused";

/** Wiederkehrende Reinigung eines Bereichs. */
export interface CleaningPlan extends BaseEntity {
  title: string;
  areaId: string;
  /** Zugewiesene Reinigungskraft. */
  cleanerId: string;
  /** Verantwortliche Person, z. B. Reinigungsleitung. */
  responsibleId: string;
  interval: CleaningInterval;
  /** Abstand in Tagen, wenn das Intervall "custom" ist. */
  intervalDays?: number;
  /** Geplante Uhrzeit als HH:MM; leer, wenn nur der Tag feststeht. */
  timeStart: string;
  startDate: string;
  nextDate: string;
  status: CleaningPlanStatus;
  /** Checkliste des Plans; ohne eigene gilt die des Bereichs. */
  checklist: ChecklistItem[];
  tour?: string;
  tourOrder?: number;
  durationMinutes?: number;
}

export type CleaningTaskStatus = "open" | "inProgress" | "done";

/** Einzelne Reinigungsaufgabe. */
export interface CleaningTask extends BaseEntity {
  title: string;
  /** Plan, aus dem die Aufgabe entstanden ist; leer bei freier Erfassung. */
  planId: string;
  areaId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  cleanerId: string;
  responsibleId: string;
  assigneeUserId: string;
  assigneeTeam: string;
  date: string;
  status: CleaningTaskStatus;
  /** Arbeitsbeginn als HH:MM; optional. */
  workStart: string;
  /** Arbeitsende als HH:MM; optional. */
  workEnd: string;
  breakMinutes: number;
  /** Verwendeter Stundenansatz; überschreibt Personal- und Rollenansatz. */
  hourlyRate?: number;
  completedAt: string;
  checklist: ChecklistItem[];
  /** Reinigungsmittel und Material. */
  materials: MaterialItem[];
}

/** Ergebnis einer Reinigungskontrolle. */
export type CleaningCheckResult = "pending" | "ok" | "minor" | "major";

/** Kontrolle durch Hauswart oder Reinigungsleitung. */
export interface CleaningCheck extends BaseEntity {
  title: string;
  areaId: string;
  /** Kontrollierte Aufgabe; leer bei einer freien Begehung. */
  taskId: string;
  date: string;
  /** Kontrollierende Person aus den Reinigungskraeften. */
  inspectorId: string;
  /** Name der kontrollierenden Person, wenn sie nicht erfasst ist. */
  inspector: string;
  result: CleaningCheckResult;
  /** Bewertung von 1 bis 6; leer, wenn nicht benotet. */
  rating?: number;
  measures: string;
}

export type CleaningComplaintStatus =
  "open" | "inProgress" | "resolved" | "rejected";

/** Reklamation zu einer Reinigung. */
export interface CleaningComplaint extends BaseEntity {
  title: string;
  areaId: string;
  taskId: string;
  customerId: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  reportedBy: string;
  reportedAt: string;
  description: string;
  priority: Priority;
  status: CleaningComplaintStatus;
  /** Bearbeitende Person aus den Reinigungskraeften. */
  assignedId: string;
  resolution: string;
  resolvedAt: string;
}

/** Plantypen der Gebaeude- und Liegenschaftsplaene. */
export type PlanType =
  | "floorPlan"
  | "escape"
  | "fire"
  | "electric"
  | "plumbing"
  | "heating"
  | "ventilation"
  | "roof"
  | "garden"
  | "other";

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
  note?: string;
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
  kind?: "asset" | "room" | "note";
  assetId?: string;
  /** Raum, den der Marker auf dem Plan bezeichnet. */
  roomId?: string;
  label: string;
  note: string;
  layerId?: string;
  /** Seite eines mehrseitigen PDF-Plans. */
  page?: number;
}

export interface PlanLayer {
  id: string;
  name: string;
  visible: boolean;
  color?: string;
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
  scale?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    meters: number;
  };
  layers?: PlanLayer[];
  createdAt: string;
}

/** Branchenpaket; leer bedeutet «alle Module aktiv». */
export type IndustryPackage =
  | ""
  | "professional"
  | "property"
  | "care"
  | "institution"
  | "industry"
  | "public"
  | "enterprise"
  | "custom";

export interface OrganizationSubscription {
  package: IndustryPackage;
  yearlyPrice: number;
  setupFee: number;
  contractStart: string;
  nextRenewal: string;
  currency: "CHF";
}

export interface ModuleConfig {
  industryPackage: IndustryPackage;
  disabledModules: ModuleKey[];
  subscription?: OrganizationSubscription;
  /** Zeitpunkt der letzten Speicherung; entscheidet, welche Quelle gilt. */
  updatedAt?: string;
}

export type Language = "de" | "fr" | "it" | "en";
export type ThemeMode = "light" | "dark" | "system";

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
  /** Rollenbasierte Verrechnungssätze; alte hourlyRate-Werte bleiben lesbar. */
  roleHourlyRates?: Partial<Record<UserRole, number>>;
  /** Verrechnungssätze je Reinigungsrolle. */
  cleanerRoleHourlyRates?: Partial<Record<CleanerRole, number>>;
  vatRate: number;
  paymentRecipient: string;
  paymentAddress: Address;
  paymentIban: string;
  paymentQrIban: string;
  paymentBank: string;
  paymentBic: string;
  paymentReferenceType: InvoiceReferenceType;
  /** Grenzwerte und Intervall der Legionellenkontrolle. */
  legionellaHotMin: number;
  legionellaColdMax: number;
  legionellaWarnCfu: number;
  legionellaLimitCfu: number;
  legionellaIntervalMonths: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  /** Eigene Reinigungskraft des angemeldeten Geraets. */
  cleaningCleanerId: string;
  /** Nur die eigenen Reinigungsaufgaben zeigen. */
  cleaningOwnTasksOnly: boolean;
  /** Vom Administrator erweiterbare technische Checklisten je Anlagentyp. */
  technicalChecklistTemplates?: Record<string, TechnicalCheckpointDefinition[]>;
  /**
   * Angemeldete Benutzerin oder Benutzer aus der Benutzerverwaltung.
   *
   * Leer bedeutet vollen Zugriff (Super-Admin) - so bleibt jede bestehende
   * Installation ohne Benutzerpflege unveraendert nutzbar. Sobald ein Konto
   * ueber Microsoft/Entra angemeldet wird, tritt dessen Kennung an diese
   * Stelle.
   */
  activeUserId: string;
  /** Verzeichnis-Kennung (Mandant) der Microsoft-365-Anbindung. */
  microsoftTenantId?: string;
  /** Anwendungs-Kennung der Registrierung im Entra ID. */
  microsoftClientId?: string;
  /** Ordner in Outlook, aus dem Nachrichten gelesen werden. */
  microsoftMailFolder?: string;
  /** Termine automatisch in beide Richtungen abgleichen. */
  microsoftSyncCalendar?: boolean;
  /** Gewaehltes Branchenpaket; nur zur Anzeige der Vorauswahl. */
  industryPackage: IndustryPackage;
  /** Abgeschaltete Module; ihre Daten bleiben erhalten. */
  disabledModules: ModuleKey[];
  /** Zeitpunkt der letzten Speicherung der Modulkonfiguration. */
  modulesUpdatedAt?: string;
  /** Organisationsbezogene Abo-Daten; die tenant_settings-Konfiguration ist führend. */
  subscription?: OrganizationSubscription;
}

/**
 * Rollen der Benutzerverwaltung.
 *
 * Die Rolle bestimmt, welche Module sichtbar sind und ob geschrieben werden
 * darf; der Umfang (Organisation, Standorte, eigene Zuweisungen) kommt aus dem
 * Benutzerdatensatz.
 */
export type UserRole =
  | "superadmin"
  | "orgadmin"
  | "sitemanager"
  | "caretaker"
  | "cleaner"
  | "reporter"
  | "external"
  | "reader";

/** Herkunft der Anmeldung; auf «entra» vorbereitet, aber noch nicht angebunden. */
export type AuthProvider = "local" | "entra";

/**
 * Benutzerin oder Benutzer von Facility365.
 *
 * Deaktivierte Benutzer verlieren jeden Zugriff, bleiben aber als Datensatz
 * erhalten: Auftraege, Rapporte und Historien verweisen weiterhin auf sie.
 */
export interface AppUser extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  /** Organisation, zu der die Person gehoert; leer bei organisationsuebergreifend. */
  organizationId: string;
  /** Zugewiesene Standorte; leer bedeutet alle Standorte der Organisation. */
  siteIds: string[];
  team: string;
  status: ActiveStatus;
  /** Kennung beim Anmeldedienst, spaeter die Objekt-Kennung aus Entra ID. */
  externalId: string;
  authProvider: AuthProvider;
  /** Individueller Verrechnungssatz; der Rollenansatz dient als Fallback. */
  hourlyRate?: number;
}

/**
 * Eintrag der unveraenderbaren Aktivitaetshistorie.
 *
 * Die Anwendung schreibt Eintraege nur an; es gibt keine Bearbeitung und kein
 * Loeschen in der Oberflaeche.
 */
export interface Activity extends BaseEntity {
  at: string;
  /** Anzeigename der handelnden Person zum Zeitpunkt der Aenderung. */
  userName: string;
  userId: string;
  /** Betroffenes Modul. */
  module: CollectionKey;
  entityId: string;
  entityNumber: string;
  entityTitle: string;
  /** Uebersetzungsschluessel der Handlung, z. B. history.updated. */
  action: string;
  /** Geaenderte Felder mit altem und neuem Wert. */
  changes?: FieldChange[];
}

/** Zuordnung von Sammlung zu Datensatztyp. */
export interface CollectionMap {
  customers: Customer;
  suppliers: Supplier;
  organizations: Organization;
  sites: Site;
  properties: Property;
  buildings: Building;
  rooms: Room;
  assets: Asset;
  documents: DocumentEntity;
  energy: EnergyEntry;
  appointments: Appointment;
  sources: Source;
  solarplants: SolarPlant;
  solaryields: SolarYield;
  orders: Order;
  maintenances: Maintenance;
  legionella: LegionellaCheck;
  rcd: RcdCheck;
  inspections: Inspection;
  playgroundchecks: PlaygroundCheck;
  firechecks: FireCheck;
  keys: KeyEntity;
  inventory: InventoryItem;
  vehicles: Vehicle;
  tools: Tool;
  visitors: Visitor;
  parking: ParkingSpace;
  waste: WasteEntry;
  stock: StockItem;
  contracts: ContractEntity;
  damages: Damage;
  tickets: Ticket;
  reports: Report;
  quotes: Quote;
  invoices: Invoice;
  cleaningareas: CleaningArea;
  cleaners: Cleaner;
  cleaningplans: CleaningPlan;
  cleaningtasks: CleaningTask;
  cleaningchecks: CleaningCheck;
  cleaningcomplaints: CleaningComplaint;
  users: AppUser;
  activities: Activity;
  privateNotes: PrivateNote;
  privateFiles: PrivateFile;
}

export type EntityOf<K extends CollectionKey> = CollectionMap[K];
