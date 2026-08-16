/**
 * Feldbeschreibung der Module.
 *
 * Aus derselben Beschreibung entstehen Formular, Stammdatenansicht, Filter und
 * Suche. Das haelt alle Module gleich aufgebaut und neue Felder muessen nur an
 * einer Stelle ergaenzt werden.
 */
import { TranslationKey } from '@/lib/i18n/dictionary';
import { CollectionKey } from '@/lib/types';

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

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
}

export interface InputField extends FieldBase {
  kind: 'text' | 'textarea' | 'number' | 'money' | 'date' | 'email' | 'tel';
}

export interface SelectField extends FieldBase {
  kind: 'select';
  options: SelectOption[];
  /** Feld erscheint als Filterleiste in der Uebersicht. */
  filter?: boolean;
}

export interface RelationField extends FieldBase {
  kind: 'relation';
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
  kind: 'switch';
}

export interface AddressField extends FieldBase {
  kind: 'address';
}

export type FieldDef = InputField | SelectField | RelationField | SwitchField | AddressField;

export type FormValues = Record<string, unknown>;

export const asString = (value: unknown): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

export const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const asBoolean = (value: unknown): boolean => value === true;

export const isAddressValue = (
  value: unknown,
): value is { street: string; zip: string; city: string; country: string } =>
  typeof value === 'object' && value !== null && 'street' in value && 'city' in value;

/** Statusfarben; sie sind ueberall gleich, damit Farben verlaesslich bleiben. */
export const STATUS_TONES: Record<string, Tone> = {
  active: 'success',
  inactive: 'neutral',
  archived: 'neutral',
  new: 'info',
  planned: 'brand',
  inProgress: 'warning',
  paused: 'neutral',
  done: 'success',
  invoiced: 'success',
  due: 'warning',
  overdue: 'danger',
  reported: 'info',
  inspection: 'brand',
  fixed: 'success',
  rejected: 'neutral',
  draft: 'neutral',
  final: 'success',
  sent: 'info',
  accepted: 'success',
  expired: 'danger',
  paid: 'success',
  cancelled: 'neutral',
  maintenance: 'warning',
  defect: 'danger',
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

const option = (value: string, labelKey: TranslationKey): SelectOption => ({
  value,
  labelKey,
  tone: STATUS_TONES[value] ?? 'neutral',
});

export const ACTIVE_OPTIONS: SelectOption[] = [
  option('active', 'status.active'),
  option('inactive', 'status.inactive'),
];

export const PROPERTY_STATUS_OPTIONS: SelectOption[] = [
  option('active', 'status.active'),
  option('inactive', 'status.inactive'),
  option('archived', 'status.archived'),
];

export const ORDER_STATUS_OPTIONS: SelectOption[] = [
  option('new', 'status.new'),
  option('planned', 'status.planned'),
  option('inProgress', 'status.inProgress'),
  option('paused', 'status.paused'),
  option('done', 'status.done'),
  option('invoiced', 'status.invoiced'),
];

export const MAINTENANCE_STATUS_OPTIONS: SelectOption[] = [
  option('planned', 'status.planned'),
  option('due', 'status.due'),
  option('overdue', 'status.overdue'),
  option('done', 'status.done'),
];

export const DAMAGE_STATUS_OPTIONS: SelectOption[] = [
  option('reported', 'status.reported'),
  option('inspection', 'status.inspection'),
  option('inProgress', 'status.inProgress'),
  option('fixed', 'status.fixed'),
  option('rejected', 'status.rejected'),
];

export const ASSET_STATUS_OPTIONS: SelectOption[] = [
  option('active', 'status.active'),
  option('maintenance', 'status.maintenance'),
  option('defect', 'status.defect'),
  option('inactive', 'status.inactive'),
];

export const REPORT_STATUS_OPTIONS: SelectOption[] = [
  option('draft', 'status.draft'),
  option('final', 'status.final'),
];

export const QUOTE_STATUS_OPTIONS: SelectOption[] = [
  option('draft', 'status.draft'),
  option('sent', 'status.sent'),
  option('accepted', 'status.accepted'),
  option('rejected', 'status.rejected'),
  option('expired', 'status.expired'),
];

export const INVOICE_STATUS_OPTIONS: SelectOption[] = [
  option('draft', 'status.draft'),
  option('sent', 'status.sent'),
  option('paid', 'status.paid'),
  option('overdue', 'status.overdue'),
  option('cancelled', 'status.cancelled'),
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  option('low', 'priority.low'),
  option('medium', 'priority.medium'),
  option('high', 'priority.high'),
  option('critical', 'priority.critical'),
];

export const INTERVAL_OPTIONS: SelectOption[] = [
  { value: 'monthly', labelKey: 'interval.monthly' },
  { value: 'quarterly', labelKey: 'interval.quarterly' },
  { value: 'semiannual', labelKey: 'interval.semiannual' },
  { value: 'annual', labelKey: 'interval.annual' },
  { value: 'biennial', labelKey: 'interval.biennial' },
];

export const REPORT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'daily', labelKey: 'report.type.daily' },
  { value: 'weekly', labelKey: 'report.type.weekly' },
  { value: 'order', labelKey: 'report.type.order' },
  { value: 'maintenance', labelKey: 'report.type.maintenance' },
  { value: 'damage', labelKey: 'report.type.damage' },
  { value: 'inspection', labelKey: 'report.type.inspection' },
];

export const CUSTOMER_TYPE_OPTIONS: SelectOption[] = [
  { value: 'company', labelKey: 'customer.type.company' },
  { value: 'private', labelKey: 'customer.type.private' },
];

export const PLAN_TYPE_OPTIONS: SelectOption[] = [
  { value: 'floorPlan', labelKey: 'plan.type.floorPlan' },
  { value: 'escape', labelKey: 'plan.type.escape' },
  { value: 'fire', labelKey: 'plan.type.fire' },
  { value: 'electric', labelKey: 'plan.type.electric' },
  { value: 'plumbing', labelKey: 'plan.type.plumbing' },
  { value: 'heating', labelKey: 'plan.type.heating' },
  { value: 'ventilation', labelKey: 'plan.type.ventilation' },
  { value: 'roof', labelKey: 'plan.type.roof' },
  { value: 'garden', labelKey: 'plan.type.garden' },
  { value: 'other', labelKey: 'plan.type.other' },
];
