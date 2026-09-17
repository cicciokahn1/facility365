/**
 * Feldbeschreibung der Module.
 *
 * Aus derselben Beschreibung entstehen Formular, Stammdatenansicht, Filter und
 * Suche. Das haelt alle Module gleich aufgebaut und neue Felder muessen nur an
 * einer Stelle ergaenzt werden.
 */
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { CollectionKey } from "@/lib/types";

export type Tone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface SelectOption {
  value: string;
  labelKey: TranslationKey;
  tone?: Tone;
}

interface FieldBase {
  name: string;
  labelKey: TranslationKey;
  required?: boolean;
  /** Breite im Formularraster; 2 = volle Breite. */
  span?: 1 | 2;
  hintKey?: TranslationKey;
  /** Beschriftung, die vom Inhalt abhaengt, z. B. Firmenname oder Nachname. */
  labelKeyOf?: (values: FormValues) => TranslationKey;
  /** Feld nur zeigen, wenn die Bedingung zutrifft. */
  visibleWhen?: (values: FormValues) => boolean;
  /** Weitere Felder mitfuehren, wenn sich dieses Feld aendert. */
  applyChange?: (value: unknown, values: FormValues) => FormValues;
}

export interface InputField extends FieldBase {
  kind:
    | "text"
    | "textarea"
    | "number"
    | "money"
    | "date"
    | "month"
    | "email"
    | "tel";
}

export interface SelectField extends FieldBase {
  kind: "select";
  options: SelectOption[];
  /** Feld erscheint als Filterleiste in der Uebersicht. */
  filter?: boolean;
}

export interface RelationField extends FieldBase {
  kind: "relation";
  collection: CollectionKey;
  /**
   * Einschraenkung auf einen uebergeordneten Datensatz:
   * `parentValueField` ist das Feld im Formular, `parentKey` das Feld im Ziel.
   */
  parentValueField?: string;
  parentKey?: string;
  filter?: boolean;
}

export interface SwitchField extends FieldBase {
  kind: "switch";
}

export interface AddressField extends FieldBase {
  kind: "address";
}

/** Freies Textfeld mit passenden Vorschlaegen, z. B. die Einheit einer Energieart. */
export interface SuggestField extends FieldBase {
  kind: "suggest";
  suggestionsOf: (values: FormValues) => string[];
}

export type FieldDef =
  | InputField
  | SelectField
  | RelationField
  | SwitchField
  | AddressField
  | SuggestField;

export type FormValues = Record<string, unknown>;

export const asString = (value: unknown): string =>
  typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";

export const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const asBoolean = (value: unknown): boolean => value === true;

export const isAddressValue = (
  value: unknown,
): value is { street: string; zip: string; city: string; country: string } =>
  typeof value === "object" &&
  value !== null &&
  "street" in value &&
  "city" in value;

/** Statusfarben; sie sind ueberall gleich, damit Farben verlaesslich bleiben. */
export const STATUS_TONES: Record<string, Tone> = {
  active: "success",
  inactive: "neutral",
  archived: "neutral",
  new: "info",
  planned: "brand",
  inProgress: "warning",
  paused: "neutral",
  waiting: "warning",
  closed: "neutral",
  done: "success",
  invoiced: "success",
  due: "warning",
  overdue: "danger",
  reported: "info",
  inspection: "brand",
  fixed: "success",
  rejected: "neutral",
  draft: "neutral",
  final: "success",
  sent: "info",
  accepted: "success",
  expired: "danger",
  paid: "success",
  cancelled: "neutral",
  maintenance: "warning",
  defect: "danger",
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const option = (value: string, labelKey: TranslationKey): SelectOption => ({
  value,
  labelKey,
  tone: STATUS_TONES[value] ?? "neutral",
});

export const ACTIVE_OPTIONS: SelectOption[] = [
  option("active", "status.active"),
  option("inactive", "status.inactive"),
];

export const SIA416_AREA_OPTIONS: SelectOption[] = [
  option("GF", "area.sia416.gf"),
  option("NF", "area.sia416.nf"),
  option("HNF", "area.sia416.hnf"),
  option("NNF", "area.sia416.nnf"),
  option("VF", "area.sia416.vf"),
  option("FF", "area.sia416.ff"),
  option("KF", "area.sia416.kf"),
];

export const DIN277_AREA_OPTIONS: SelectOption[] = [
  option("NUF", "area.din277.nuf"),
  option("TF", "area.din277.tf"),
  option("VF", "area.din277.vf"),
  option("KGF", "area.din277.kgf"),
  option("BGF", "area.din277.bgf"),
];

export const CONDITION_RATING_OPTIONS: SelectOption[] = [
  option("1", "asset.condition.1",),
  option("2", "asset.condition.2",),
  option("3", "asset.condition.3",),
  option("4", "asset.condition.4",),
  option("5", "asset.condition.5",),
];

export const ASSET_CONDITION_STATUS_OPTIONS: SelectOption[] = [
  option("new", "asset.conditionStatus.new"),
  option("good", "asset.conditionStatus.good"),
  option("watch", "asset.conditionStatus.watch"),
  option("critical", "asset.conditionStatus.critical"),
  option("outOfService", "asset.conditionStatus.outOfService"),
];

export const RENEWAL_YEAR_OPTIONS: SelectOption[] = Array.from(
  { length: 26 },
  (_, index) => {
    const year = String(2020 + index);
    return option(year, year as TranslationKey);
  },
);

export const ASSET_LIFECYCLE_OPTIONS: SelectOption[] = [
  option("planned", "asset.lifecycle.planned"),
  option("inOperation", "asset.lifecycle.inOperation"),
  option("maintained", "asset.lifecycle.maintained"),
  option("retired", "asset.lifecycle.retired"),
  option("disposed", "asset.lifecycle.disposed"),
];

export const ASSET_CRITICALITY_OPTIONS: SelectOption[] = [
  option("low", "priority.low"),
  option("medium", "priority.medium"),
  option("high", "priority.high"),
];

/** Erfasste Energiearten. */
/** Uebliche Einheiten je Energieart; die erste ist der Vorschlag. */
export const ENERGY_UNIT_SUGGESTIONS: Record<string, string[]> = {
  electricity: ["kWh"],
  water: ["m3"],
  oil: ["l"],
  gas: ["m3", "kWh"],
  pellets: ["kg", "t"],
  districtHeating: ["kWh"],
  wood: ["Ster", "kg"],
  solar: ["kWh"],
  heatPump: ["kWh"],
  other: [],
};

/** Vorgeschlagene Einheit je Energieart. */
export const ENERGY_UNITS: Record<string, string> = Object.fromEntries(
  Object.entries(ENERGY_UNIT_SUGGESTIONS).map(([type, units]) => [
    type,
    units[0] ?? "",
  ]),
);

/** Alle bekannten Einheiten; eigene Eingaben werden daran erkannt. */
export const ENERGY_KNOWN_UNITS: string[] = Array.from(
  new Set(Object.values(ENERGY_UNIT_SUGGESTIONS).flat()),
);

/** Stand eines Schluessels in der Schluesselverwaltung. */
export const KEY_STATUS_OPTIONS: SelectOption[] = [
  { value: "available", labelKey: "keys.available", tone: "success" },
  { value: "issued", labelKey: "keys.issued", tone: "info" },
  { value: "lost", labelKey: "keys.lost", tone: "danger" },
  { value: "retired", labelKey: "keys.retired", tone: "neutral" },
];

/** Stand eines Vertrags. */
export const CONTRACT_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", labelKey: "contracts.active", tone: "success" },
  { value: "terminated", labelKey: "contracts.terminated", tone: "warning" },
  { value: "expired", labelKey: "contracts.expired", tone: "neutral" },
];

/** Uebliche Vertragsarten; "Sonstiges" bleibt immer waehlbar. */
export const CONTRACT_TYPE_OPTIONS: SelectOption[] = [
  option("maintenance", "contracts.typeMaintenance"),
  option("service", "contracts.typeService"),
  option("cleaning", "contracts.typeCleaning"),
  option("supply", "contracts.typeSupply"),
  option("rent", "contracts.typeRent"),
  option("insurance", "contracts.typeInsurance"),
  option("subscription", "contracts.typeSubscription"),
  option("other", "contracts.typeOther"),
];

/** Kuendigungsfrist in Monaten vor Vertragsende. */
export const NOTICE_PERIOD_OPTIONS: SelectOption[] = [
  option("0", "contracts.noticeNone"),
  option("1", "contracts.notice1"),
  option("2", "contracts.notice2"),
  option("3", "contracts.notice3"),
  option("6", "contracts.notice6"),
  option("12", "contracts.notice12"),
];

export const ENERGY_TYPE_OPTIONS: SelectOption[] = [
  option("electricity", "energy.electricity"),
  option("water", "energy.water"),
  option("oil", "energy.oil"),
  option("gas", "energy.gas"),
  option("pellets", "energy.pellets"),
  option("districtHeating", "energy.districtHeating"),
  option("wood", "energy.wood"),
  option("solar", "energy.solar"),
  option("heatPump", "energy.heatPump"),
  option("other", "energy.other"),
];

/** Stand einer Photovoltaikanlage. */
export const SOLAR_STATUS_OPTIONS: SelectOption[] = [
  option("planned", "solar.statusPlanned"),
  option("active", "solar.statusActive"),
  option("inactive", "solar.statusInactive"),
];

/** Kategorien einer Anlage; "Sonstige" faengt alles Uebrige auf. */
export const ASSET_CATEGORY_OPTIONS: SelectOption[] = [
  option("heating", "assetCategory.heating"),
  option("ventilation", "assetCategory.ventilation"),
  option("climate", "assetCategory.climate"),
  option("plumbing", "assetCategory.plumbing"),
  option("electrical", "assetCategory.electrical"),
  option("elevator", "assetCategory.elevator"),
  option("security", "assetCategory.security"),
  option("fireAlarm", "assetCategory.fireAlarm"),
  option("automation", "assetCategory.automation"),
  option("garden", "assetCategory.garden"),
  option("other", "assetCategory.other"),
];

/** Kategorien eines Dokuments; "Sonstiges" faengt alles Uebrige auf. */
export const DOCUMENT_CATEGORY_OPTIONS: SelectOption[] = [
  option("contract", "documentCategory.contract"),
  option("invoice", "documentCategory.invoice"),
  option("quote", "documentCategory.quote"),
  option("serviceReport", "documentCategory.serviceReport"),
  option("maintenanceReport", "documentCategory.maintenanceReport"),
  option("manual", "documentCategory.manual"),
  option("warranty", "documentCategory.warranty"),
  option("plan", "documentCategory.plan"),
  option("inspection", "documentCategory.inspection"),
  option("photo", "documentCategory.photo"),
  option("other", "documentCategory.other"),
];

/** Kategorien eines Lieferanten; "Sonstige" faengt alles Uebrige auf. */
export const SUPPLIER_CATEGORY_OPTIONS: SelectOption[] = [
  option("heating", "supplierCategory.heating"),
  option("plumbing", "supplierCategory.plumbing"),
  option("electrical", "supplierCategory.electrical"),
  option("cleaning", "supplierCategory.cleaning"),
  option("garden", "supplierCategory.garden"),
  option("elevator", "supplierCategory.elevator"),
  option("security", "supplierCategory.security"),
  option("it", "supplierCategory.it"),
  option("construction", "supplierCategory.construction"),
  option("buildingServices", "supplierCategory.buildingServices"),
  option("other", "supplierCategory.other"),
];

/** Arten eines Kalendertermins. */
export const APPOINTMENT_TYPE_OPTIONS: SelectOption[] = [
  option("appointment", "appointment.type.appointment"),
  option("meeting", "appointment.type.meeting"),
  option("visit", "appointment.type.visit"),
  option("service", "appointment.type.service"),
  option("absence", "appointment.type.absence"),
  option("other", "appointment.type.other"),
];

/** Status eines Kalendertermins. */
export const APPOINTMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "planned", labelKey: "appointment.status.planned", tone: "info" },
  { value: "done", labelKey: "appointment.status.done", tone: "success" },
  {
    value: "cancelled",
    labelKey: "appointment.status.cancelled",
    tone: "neutral",
  },
];

/** Kategorien einer Bezugsquelle. */
export const SOURCE_CATEGORY_OPTIONS: SelectOption[] = [
  option("tools", "sourceCategory.tools"),
  option("material", "sourceCategory.material"),
  option("cleaning", "sourceCategory.cleaning"),
  option("spareParts", "sourceCategory.spareParts"),
  option("electrical", "sourceCategory.electrical"),
  option("plumbing", "sourceCategory.plumbing"),
  option("construction", "sourceCategory.construction"),
  option("other", "sourceCategory.other"),
];

/** Persoenliche Bewertung einer Bezugsquelle. */
export const SOURCE_RATING_OPTIONS: SelectOption[] = [
  option("5", "source.rating5"),
  option("4", "source.rating4"),
  option("3", "source.rating3"),
  option("2", "source.rating2"),
  option("1", "source.rating1"),
];

/** Rollen der Benutzerverwaltung, von der weitesten zur engsten Berechtigung. */
export const USER_ROLE_OPTIONS: SelectOption[] = [
  { value: "superadmin", labelKey: "role.superadmin", tone: "danger" },
  { value: "orgadmin", labelKey: "role.orgadmin", tone: "brand" },
  { value: "sitemanager", labelKey: "role.sitemanager", tone: "info" },
  { value: "caretaker", labelKey: "role.caretaker", tone: "info" },
  { value: "cleaner", labelKey: "role.cleaner", tone: "neutral" },
  { value: "reporter", labelKey: "role.reporter", tone: "neutral" },
  { value: "external", labelKey: "role.external", tone: "warning" },
  { value: "reader", labelKey: "role.reader", tone: "neutral" },
];

/** Benutzer sind aktiv oder deaktiviert; geloescht wird nie. */
export const USER_STATUS_OPTIONS: SelectOption[] = [
  option("active", "status.active"),
  option("inactive", "status.inactive"),
];

export const PROPERTY_STATUS_OPTIONS: SelectOption[] = [
  option("active", "status.active"),
  option("inactive", "status.inactive"),
  option("archived", "status.archived"),
];

export const ORDER_STATUS_OPTIONS: SelectOption[] = [
  option("new", "status.new"),
  option("planned", "status.planned"),
  option("inProgress", "status.inProgress"),
  option("paused", "status.paused"),
  option("done", "status.done"),
  option("invoiced", "status.invoiced"),
];

export const MAINTENANCE_STATUS_OPTIONS: SelectOption[] = [
  option("planned", "status.planned"),
  option("due", "status.due"),
  option("overdue", "status.overdue"),
  option("done", "status.done"),
];

/** Bewertung einer Legionellenkontrolle. */
export const LEGIONELLA_RESULT_OPTIONS: SelectOption[] = [
  { value: "pending", labelKey: "legionella.pending", tone: "neutral" },
  { value: "ok", labelKey: "legionella.ok", tone: "success" },
  { value: "warning", labelKey: "legionella.warning", tone: "warning" },
  { value: "critical", labelKey: "legionella.critical", tone: "danger" },
];

/** Stand einer FI-Kontrolle. */
export const RCD_STATUS_OPTIONS: SelectOption[] = [
  { value: "open", labelKey: "rcd.open", tone: "info" },
  { value: "done", labelKey: "rcd.done", tone: "success" },
];

/** Ergebnis einer FI-Kontrolle. */
export const RCD_RESULT_OPTIONS: SelectOption[] = [
  { value: "pending", labelKey: "rcd.pending", tone: "neutral" },
  { value: "passed", labelKey: "rcd.passed", tone: "success" },
  { value: "failed", labelKey: "rcd.failed", tone: "danger" },
];

/** Arten der Betreiberkontrollen; 'custom' traegt eine eigene Bezeichnung. */
export const INSPECTION_TYPE_OPTIONS: SelectOption[] = [
  option("fire", "inspection.type.fire"),
  option("emergencyLight", "inspection.type.emergencyLight"),
  option("escapeRoute", "inspection.type.escapeRoute"),
  option("safety", "inspection.type.safety"),
  option("elevator", "inspection.type.elevator"),
  option("ladder", "inspection.type.ladder"),
  option("playground", "inspection.type.playground"),
  option("custom", "inspection.type.custom"),
];

/** Arten der Spielplatzkontrolle. */
export const PLAYGROUND_TYPE_OPTIONS: SelectOption[] = [
  option("visual", "playground.type.visual"),
  option("functional", "playground.type.functional"),
  option("periodic", "playground.type.periodic"),
];

/** Zustand eines Spielplatzes nach der Kontrolle. */
export const PLAYGROUND_CONDITION_OPTIONS: SelectOption[] = [
  { value: "good", labelKey: "playground.condition.good", tone: "success" },
  { value: "minor", labelKey: "playground.condition.minor", tone: "warning" },
  { value: "defect", labelKey: "playground.condition.defect", tone: "danger" },
  { value: "closed", labelKey: "playground.condition.closed", tone: "danger" },
];

/** Geprueftes Brandschutzelement; 'custom' traegt eine eigene Bezeichnung. */
export const FIRE_TYPE_OPTIONS: SelectOption[] = [
  option("extinguisher", "fire.type.extinguisher"),
  option("alarm", "fire.type.alarm"),
  option("escapeRoute", "fire.type.escapeRoute"),
  option("emergencyExit", "fire.type.emergencyExit"),
  option("fireDoor", "fire.type.fireDoor"),
  option("smokeExtraction", "fire.type.smokeExtraction"),
  option("extinguishingWater", "fire.type.extinguishingWater"),
  option("signage", "fire.type.signage"),
  option("firing", "fire.type.firing"),
  option("custom", "fire.type.custom"),
];

/** Brennstoff einer Feuerungsanlage. */
export const FIRING_FUEL_OPTIONS: SelectOption[] = [
  option("oil", "firing.fuel.oil"),
  option("gas", "firing.fuel.gas"),
  option("wood", "firing.fuel.wood"),
  option("pellets", "firing.fuel.pellets"),
  option("woodchips", "firing.fuel.woodchips"),
  option("heatpump", "firing.fuel.heatpump"),
  option("other", "firing.fuel.other"),
];

/** Umfang der Feuerungskontrolle. */
export const FIRING_SCOPE_OPTIONS: SelectOption[] = [
  option("periodic", "firing.scope.periodic"),
  option("cleaning", "firing.scope.cleaning"),
  option("measurement", "firing.scope.measurement"),
  option("safety", "firing.scope.safety"),
];

/** Zustand einer Brandschutzeinrichtung nach der Kontrolle. */
export const FIRE_CONDITION_OPTIONS: SelectOption[] = [
  { value: "good", labelKey: "fire.condition.good", tone: "success" },
  { value: "minor", labelKey: "fire.condition.minor", tone: "warning" },
  { value: "defect", labelKey: "fire.condition.defect", tone: "danger" },
  { value: "critical", labelKey: "fire.condition.critical", tone: "danger" },
];

/** Zustand eines Inventargegenstands oder Werkzeugs. */
export const CONDITION_OPTIONS: SelectOption[] = [
  { value: "new", labelKey: "condition.new", tone: "success" },
  { value: "good", labelKey: "condition.good", tone: "success" },
  { value: "used", labelKey: "condition.used", tone: "neutral" },
  { value: "defect", labelKey: "condition.defect", tone: "danger" },
  { value: "disposed", labelKey: "condition.disposed", tone: "neutral" },
];

/** Stand eines Fahrzeugs. */
export const VEHICLE_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", labelKey: "vehicle.active", tone: "success" },
  { value: "service", labelKey: "vehicle.inService", tone: "warning" },
  { value: "retired", labelKey: "vehicle.retired", tone: "neutral" },
];

/** Kategorien fuer Inventar und Werkzeuge. */
export const INVENTORY_CATEGORY_OPTIONS: SelectOption[] = [
  option("furniture", "inventory.category.furniture"),
  option("it", "inventory.category.it"),
  option("machine", "inventory.category.machine"),
  option("appliance", "inventory.category.appliance"),
  option("tool", "inventory.category.tool"),
  option("vehicle", "inventory.category.vehicle"),
  option("other", "inventory.category.other"),
];

export const DAMAGE_STATUS_OPTIONS: SelectOption[] = [
  option("reported", "status.reported"),
  option("inspection", "status.inspection"),
  option("inProgress", "status.inProgress"),
  option("fixed", "status.fixed"),
  option("rejected", "status.rejected"),
];

/** Helpdesk: Bearbeitungsstand einer Meldung. */
export const TICKET_STATUS_OPTIONS: SelectOption[] = [
  option("new", "status.new"),
  option("inProgress", "status.inProgress"),
  option("waiting", "status.waiting"),
  option("done", "status.done"),
  option("closed", "status.closed"),
];

/** Helpdesk: Art der Meldung. */
export const TICKET_CATEGORY_OPTIONS: SelectOption[] = [
  option("fault", "ticket.category.fault"),
  option("damage", "ticket.category.damage"),
  option("cleaning", "ticket.category.cleaning"),
  option("request", "ticket.category.request"),
  option("question", "ticket.category.question"),
  option("other", "ticket.category.other"),
];

export const ASSET_STATUS_OPTIONS: SelectOption[] = [
  option("active", "status.active"),
  option("maintenance", "status.maintenance"),
  option("defect", "status.defect"),
  option("inactive", "status.inactive"),
];

export const REPORT_STATUS_OPTIONS: SelectOption[] = [
  option("draft", "status.draft"),
  option("final", "status.final"),
];

export const QUOTE_STATUS_OPTIONS: SelectOption[] = [
  option("draft", "status.draft"),
  option("sent", "status.sent"),
  option("accepted", "status.accepted"),
  option("rejected", "status.rejected"),
  option("expired", "status.expired"),
];

export const INVOICE_STATUS_OPTIONS: SelectOption[] = [
  option("draft", "status.draft"),
  option("sent", "status.sent"),
  option("paid", "status.paid"),
  option("overdue", "status.overdue"),
  option("cancelled", "status.cancelled"),
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  option("low", "priority.low"),
  option("medium", "priority.medium"),
  option("high", "priority.high"),
  option("critical", "priority.critical"),
];

export const INTERVAL_OPTIONS: SelectOption[] = [
  { value: "monthly", labelKey: "interval.monthly" },
  { value: "quarterly", labelKey: "interval.quarterly" },
  { value: "semiannual", labelKey: "interval.semiannual" },
  { value: "annual", labelKey: "interval.annual" },
  { value: "biennial", labelKey: "interval.biennial" },
];

export const REPORT_TYPE_OPTIONS: SelectOption[] = [
  { value: "daily", labelKey: "report.type.daily" },
  { value: "weekly", labelKey: "report.type.weekly" },
  { value: "order", labelKey: "report.type.order" },
  { value: "maintenance", labelKey: "report.type.maintenance" },
  { value: "damage", labelKey: "report.type.damage" },
  { value: "inspection", labelKey: "report.type.inspection" },
];

export const CUSTOMER_TYPE_OPTIONS: SelectOption[] = [
  { value: "company", labelKey: "customer.type.company" },
  { value: "private", labelKey: "customer.type.private" },
];

/** Rolle einer Person der Reinigung. */
export const CLEANER_ROLE_OPTIONS: SelectOption[] = [
  { value: "cleaner", labelKey: "cleaning.role.cleaner", tone: "brand" },
  { value: "lead", labelKey: "cleaning.role.lead", tone: "info" },
  { value: "caretaker", labelKey: "cleaning.role.caretaker", tone: "info" },
  { value: "external", labelKey: "cleaning.role.external", tone: "neutral" },
];

/** Art eines Reinigungsbereichs; "Sonstiges" faengt alles Uebrige auf. */
export const CLEANING_AREA_TYPE_OPTIONS: SelectOption[] = [
  option("office", "cleaning.areaType.office"),
  option("stairway", "cleaning.areaType.stairway"),
  option("sanitary", "cleaning.areaType.sanitary"),
  option("kitchen", "cleaning.areaType.kitchen"),
  option("corridor", "cleaning.areaType.corridor"),
  option("entrance", "cleaning.areaType.entrance"),
  option("laundry", "cleaning.areaType.laundry"),
  option("garage", "cleaning.areaType.garage"),
  option("outdoor", "cleaning.areaType.outdoor"),
  option("other", "cleaning.areaType.other"),
];

/** Reinigungsintervalle; "individuell" rechnet mit einer eigenen Anzahl Tage. */
export const CLEANING_INTERVAL_OPTIONS: SelectOption[] = [
  { value: "daily", labelKey: "cleaning.interval.daily" },
  { value: "weekly", labelKey: "cleaning.interval.weekly" },
  { value: "biweekly", labelKey: "cleaning.interval.biweekly" },
  { value: "monthly", labelKey: "cleaning.interval.monthly" },
  { value: "quarterly", labelKey: "cleaning.interval.quarterly" },
  { value: "custom", labelKey: "cleaning.interval.custom" },
];

/** Stand eines Reinigungsplans. */
export const CLEANING_PLAN_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", labelKey: "cleaning.plan.active", tone: "success" },
  { value: "paused", labelKey: "cleaning.plan.paused", tone: "neutral" },
];

/** Stand einer Reinigungsaufgabe. */
export const CLEANING_TASK_STATUS_OPTIONS: SelectOption[] = [
  { value: "open", labelKey: "cleaning.task.open", tone: "info" },
  { value: "inProgress", labelKey: "status.inProgress", tone: "warning" },
  { value: "done", labelKey: "status.done", tone: "success" },
];

/** Ergebnis einer Reinigungskontrolle. */
export const CLEANING_CHECK_RESULT_OPTIONS: SelectOption[] = [
  { value: "pending", labelKey: "cleaning.check.pending", tone: "neutral" },
  { value: "ok", labelKey: "cleaning.check.ok", tone: "success" },
  { value: "minor", labelKey: "cleaning.check.minor", tone: "warning" },
  { value: "major", labelKey: "cleaning.check.major", tone: "danger" },
];

/** Stand einer Reklamation. */
export const CLEANING_COMPLAINT_STATUS_OPTIONS: SelectOption[] = [
  { value: "open", labelKey: "cleaning.complaint.open", tone: "info" },
  { value: "inProgress", labelKey: "status.inProgress", tone: "warning" },
  {
    value: "resolved",
    labelKey: "cleaning.complaint.resolved",
    tone: "success",
  },
  { value: "rejected", labelKey: "status.rejected", tone: "neutral" },
];

export const PLAN_TYPE_OPTIONS: SelectOption[] = [
  { value: "floorPlan", labelKey: "plan.type.floorPlan" },
  { value: "escape", labelKey: "plan.type.escape" },
  { value: "fire", labelKey: "plan.type.fire" },
  { value: "electric", labelKey: "plan.type.electric" },
  { value: "plumbing", labelKey: "plan.type.plumbing" },
  { value: "heating", labelKey: "plan.type.heating" },
  { value: "ventilation", labelKey: "plan.type.ventilation" },
  { value: "roof", labelKey: "plan.type.roof" },
  { value: "garden", labelKey: "plan.type.garden" },
  { value: "other", labelKey: "plan.type.other" },
];
