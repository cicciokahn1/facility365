/**
 * Beschreibung aller Datenmodule.
 *
 * Jedes Modul besteht aus denselben Bausteinen: Titel, Status, Felder und
 * Suchtext. Uebersicht, Formular und Detailansicht werden daraus erzeugt.
 */
import { TranslationKey } from '@/lib/i18n/dictionary';
import {
  ACTIVE_OPTIONS,
  ASSET_CATEGORY_OPTIONS,
  ASSET_STATUS_OPTIONS,
  CLEANER_ROLE_OPTIONS,
  CLEANING_AREA_TYPE_OPTIONS,
  CLEANING_CHECK_RESULT_OPTIONS,
  CLEANING_COMPLAINT_STATUS_OPTIONS,
  CLEANING_INTERVAL_OPTIONS,
  CLEANING_PLAN_STATUS_OPTIONS,
  CLEANING_TASK_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  DAMAGE_STATUS_OPTIONS,
  DOCUMENT_CATEGORY_OPTIONS,
  ENERGY_KNOWN_UNITS,
  ENERGY_TYPE_OPTIONS,
  ENERGY_UNITS,
  ENERGY_UNIT_SUGGESTIONS,
  FieldDef,
  FormValues,
  INTERVAL_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  KEY_STATUS_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
  LEGIONELLA_RESULT_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  INSPECTION_TYPE_OPTIONS,
  RCD_RESULT_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  RCD_STATUS_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
  SelectOption,
  SUPPLIER_CATEGORY_OPTIONS,
  asString,
} from '@/lib/schema';
import { INTERVAL_MONTHS, nextControlDate } from '@/lib/legionella/evaluate';
import { BaseEntity, CollectionKey, EntityOf, MaintenanceInterval } from '@/lib/types';

export interface ModuleConfig<K extends CollectionKey> {
  collection: K;
  /** Anzeigename eines Datensatzes, z. B. in Listen und Auswahlfeldern. */
  titleOf: (entity: EntityOf<K>) => string;
  /** Feld, das den Status fuehrt; bestimmt Farbe und Filterleiste. */
  statusField?: string;
  statusOptions?: SelectOption[];
  fields: FieldDef[];
  searchOf: (entity: EntityOf<K>) => string;
}

const text = (
  name: string,
  labelKey: TranslationKey,
  extra: Partial<FieldDef> = {},
): FieldDef => ({ kind: 'text', name, labelKey, ...extra }) as FieldDef;

const customersConfig: ModuleConfig<'customers'> = {
  collection: 'customers',
  titleOf: (customer) =>
    customer.type === 'private'
      ? [customer.firstName, customer.name].filter(Boolean).join(' ') || customer.number
      : customer.name || customer.number,
  statusField: 'status',
  statusOptions: ACTIVE_OPTIONS,
  fields: [
    { kind: 'select', name: 'type', labelKey: 'customer.type', options: CUSTOMER_TYPE_OPTIONS, filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ACTIVE_OPTIONS, filter: true },
    {
      kind: 'text',
      name: 'firstName',
      labelKey: 'customer.firstName',
      visibleWhen: (values) => values.type === 'private',
    },
    {
      kind: 'text',
      name: 'name',
      labelKey: 'customer.companyName',
      labelKeyOf: (values) => (values.type === 'private' ? 'customer.lastName' : 'customer.companyName'),
      required: true,
    },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'tel', name: 'mobile', labelKey: 'common.mobile' },
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    text('website', 'common.website'),
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (customer) =>
    [customer.number, customer.name, customer.firstName, customer.email, customer.phone, customer.address.city]
      .filter(Boolean)
      .join(' '),
};

const suppliersConfig: ModuleConfig<'suppliers'> = {
  collection: 'suppliers',
  titleOf: (supplier) => supplier.name || supplier.number,
  statusField: 'status',
  statusOptions: ACTIVE_OPTIONS,
  fields: [
    text('name', 'supplier.company', { required: true, span: 2 }),
    text('contactPerson', 'supplier.contactPerson'),
    {
      kind: 'select',
      name: 'category',
      labelKey: 'supplier.category',
      options: SUPPLIER_CATEGORY_OPTIONS,
      filter: true,
    },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ACTIVE_OPTIONS, filter: true },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'tel', name: 'mobile', labelKey: 'common.mobile' },
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    text('website', 'common.website'),
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (supplier) =>
    [supplier.number, supplier.name, supplier.contactPerson, supplier.category, supplier.email, supplier.phone, supplier.address.city]
      .filter(Boolean)
      .join(' '),
};

const organizationsConfig: ModuleConfig<'organizations'> = {
  collection: 'organizations',
  titleOf: (organization) => organization.name || organization.number,
  statusField: 'status',
  statusOptions: PROPERTY_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    text('shortName', 'site.shortName'),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: PROPERTY_STATUS_OPTIONS, filter: true },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    text('manager', 'organization.manager'),
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    text('website', 'common.website'),
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (organization) =>
    [
      organization.number,
      organization.name,
      organization.shortName,
      organization.manager,
      organization.address.city,
    ]
      .filter(Boolean)
      .join(' '),
};

const sitesConfig: ModuleConfig<'sites'> = {
  collection: 'sites',
  titleOf: (site) => site.name || site.number,
  statusField: 'status',
  statusOptions: PROPERTY_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    text('shortName', 'site.shortName'),
    { kind: 'relation', name: 'organizationId', labelKey: 'module.organizations.singular', collection: 'organizations', filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: PROPERTY_STATUS_OPTIONS, filter: true },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    text('manager', 'site.manager'),
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (site) =>
    [site.number, site.name, site.shortName, site.manager, site.address.street, site.address.city]
      .filter(Boolean)
      .join(' '),
};

const propertiesConfig: ModuleConfig<'properties'> = {
  collection: 'properties',
  titleOf: (property) => property.name || property.number,
  statusField: 'status',
  statusOptions: PROPERTY_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    { kind: 'relation', name: 'siteId', labelKey: 'module.sites.singular', collection: 'sites', filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: PROPERTY_STATUS_OPTIONS, filter: true },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    { kind: 'date', name: 'contractStart', labelKey: 'customer.contractStart' },
    { kind: 'date', name: 'contractEnd', labelKey: 'customer.contractEnd' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (property) =>
    [property.number, property.name, property.address.street, property.address.city].filter(Boolean).join(' '),
};

const buildingsConfig: ModuleConfig<'buildings'> = {
  collection: 'buildings',
  titleOf: (building) => building.name || building.number,
  statusField: 'status',
  statusOptions: PROPERTY_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: PROPERTY_STATUS_OPTIONS, filter: true },
    { kind: 'address', name: 'address', labelKey: 'common.address', span: 2 },
    text('yearBuilt', 'common.date'),
    { kind: 'number', name: 'area', labelKey: 'common.area' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (building) =>
    [building.number, building.name, building.address.street, building.address.city].filter(Boolean).join(' '),
};

const roomsConfig: ModuleConfig<'rooms'> = {
  collection: 'rooms',
  titleOf: (room) => [room.roomNumber, room.name].filter(Boolean).join(' · ') || room.number,
  statusField: 'status',
  statusOptions: ACTIVE_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true }),
    text('roomNumber', 'common.number'),
    { kind: 'relation', name: 'buildingId', labelKey: 'module.buildings.singular', collection: 'buildings', filter: true },
    text('type', 'common.type'),
    { kind: 'number', name: 'area', labelKey: 'common.area' },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ACTIVE_OPTIONS, filter: true },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (room) => [room.number, room.name, room.roomNumber, room.type].filter(Boolean).join(' '),
};

const assetsConfig: ModuleConfig<'assets'> = {
  collection: 'assets',
  titleOf: (asset) => asset.name || asset.number,
  statusField: 'status',
  statusOptions: ASSET_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'category',
      labelKey: 'common.category',
      options: ASSET_CATEGORY_OPTIONS,
      filter: true,
    },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ASSET_STATUS_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    text('location', 'common.location'),
    text('manufacturer', 'asset.manufacturer'),
    text('model', 'asset.model'),
    text('serialNumber', 'asset.serial'),
    text('manufacturedYear', 'asset.year'),
    { kind: 'date', name: 'installedAt', labelKey: 'asset.installedAt' },
    { kind: 'date', name: 'warrantyUntil', labelKey: 'asset.warrantyUntil' },
    {
      kind: 'relation',
      name: 'supplierId',
      labelKey: 'module.suppliers.singular',
      collection: 'suppliers',
      filter: true,
    },
    text('warrantyNote', 'asset.warrantyNote', { span: 2 }),
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (asset) =>
    [asset.number, asset.name, asset.category, asset.manufacturer, asset.model, asset.serialNumber, asset.manufacturedYear]
      .filter(Boolean)
      .join(' '),
};

const documentsConfig: ModuleConfig<'documents'> = {
  collection: 'documents',
  titleOf: (document) => document.title || document.file?.name || document.number,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'category',
      labelKey: 'common.category',
      options: DOCUMENT_CATEGORY_OPTIONS,
      filter: true,
    },
    { kind: 'date', name: 'validUntil', labelKey: 'documents.validUntil' },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    { kind: 'relation', name: 'orderId', labelKey: 'module.orders.singular', collection: 'orders' },
    {
      kind: 'relation',
      name: 'maintenanceId',
      labelKey: 'module.maintenances.singular',
      collection: 'maintenances',
    },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (document) =>
    [document.number, document.title, document.category, document.file?.name].filter(Boolean).join(' '),
};

const energyConfig: ModuleConfig<'energy'> = {
  collection: 'energy',
  titleOf: (entry) => entry.month || entry.number,
  statusField: 'type',
  statusOptions: ENERGY_TYPE_OPTIONS,
  fields: [
    {
      kind: 'select',
      name: 'type',
      labelKey: 'energy.type',
      options: ENERGY_TYPE_OPTIONS,
      filter: true,
      // Einheit der neuen Art vorschlagen, sofern keine eigene erfasst ist.
      applyChange: (value, values) => {
        const previous = asString(values.unit).trim();
        const known = ENERGY_KNOWN_UNITS.includes(previous);
        if (previous && !known) return {};
        return { unit: ENERGY_UNITS[asString(value)] ?? previous };
      },
    },
    {
      kind: 'text',
      name: 'typeOther',
      labelKey: 'energy.typeOther',
      visibleWhen: (values) => values.type === 'other',
    },
    { kind: 'month', name: 'month', labelKey: 'energy.month', required: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    { kind: 'number', name: 'consumption', labelKey: 'energy.consumption' },
    {
      kind: 'suggest',
      name: 'unit',
      labelKey: 'energy.unit',
      suggestionsOf: (values) => ENERGY_UNIT_SUGGESTIONS[asString(values.type)] ?? [],
    },
    { kind: 'money', name: 'cost', labelKey: 'energy.cost' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (entry) =>
    [entry.number, entry.month, entry.typeOther, entry.unit, entry.notes].filter(Boolean).join(' '),
};

const ordersConfig: ModuleConfig<'orders'> = {
  collection: 'orders',
  titleOf: (order) => order.title || order.number,
  statusField: 'status',
  statusOptions: ORDER_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ORDER_STATUS_OPTIONS, filter: true },
    { kind: 'select', name: 'priority', labelKey: 'common.priority', options: PRIORITY_OPTIONS, filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers' },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    { kind: 'relation', name: 'quoteId', labelKey: 'module.quotes.singular', collection: 'quotes' },
    {
      kind: 'relation',
      name: 'supplierId',
      labelKey: 'module.suppliers.singular',
      collection: 'suppliers',
      filter: true,
    },
    text('assignee', 'common.assignee'),
    {
      kind: 'relation',
      name: 'assigneeUserId',
      labelKey: 'user.assignee',
      collection: 'users',
      filter: true,
    },
    text('assigneeTeam', 'user.team'),
    { kind: 'date', name: 'dueDate', labelKey: 'common.dueDate' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (order) =>
    [order.number, order.title, order.description, order.assignee].filter(Boolean).join(' '),
};

const maintenancesConfig: ModuleConfig<'maintenances'> = {
  collection: 'maintenances',
  titleOf: (maintenance) => maintenance.title || maintenance.number,
  statusField: 'status',
  statusOptions: MAINTENANCE_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: MAINTENANCE_STATUS_OPTIONS, filter: true },
    { kind: 'select', name: 'interval', labelKey: 'interval.annual', options: INTERVAL_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    {
      kind: 'relation',
      name: 'supplierId',
      labelKey: 'module.suppliers.singular',
      collection: 'suppliers',
      filter: true,
    },
    text('company', 'settings.company'),
    text('responsible', 'common.responsible'),
    {
      kind: 'relation',
      name: 'assigneeUserId',
      labelKey: 'user.assignee',
      collection: 'users',
      filter: true,
    },
    text('assigneeTeam', 'user.team'),
    { kind: 'date', name: 'lastDate', labelKey: 'common.date' },
    { kind: 'date', name: 'nextDate', labelKey: 'common.dueDate' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (maintenance) =>
    [maintenance.number, maintenance.title, maintenance.company, maintenance.responsible]
      .filter(Boolean)
      .join(' '),
};

/** Naechsten Termin aus Datum und Intervall vorschlagen. */
const withNextDate = (values: FormValues): FormValues => {
  const date = asString(values.date);
  const months = INTERVAL_MONTHS[asString(values.interval) as MaintenanceInterval] ?? 12;
  const next = nextControlDate(date, months);
  return next ? { nextDate: next } : {};
};

const legionellaConfig: ModuleConfig<'legionella'> = {
  collection: 'legionella',
  titleOf: (check) => check.title || check.system || check.number,
  statusField: 'result',
  statusOptions: LEGIONELLA_RESULT_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'result',
      labelKey: 'legionella.result',
      options: LEGIONELLA_RESULT_OPTIONS,
      filter: true,
    },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    text('system', 'legionella.system'),
    text('measuringPoint', 'legionella.point'),
    {
      kind: 'date',
      name: 'date',
      labelKey: 'common.date',
      applyChange: (value, values) => withNextDate({ ...values, date: value }),
    },
    {
      kind: 'select',
      name: 'interval',
      labelKey: 'legionella.interval',
      options: INTERVAL_OPTIONS,
      filter: true,
      applyChange: (value, values) => withNextDate({ ...values, interval: value }),
    },
    { kind: 'date', name: 'nextDate', labelKey: 'legionella.nextControl' },
    text('responsible', 'common.responsible'),
    { kind: 'number', name: 'hotTemp', labelKey: 'legionella.hotTemp' },
    { kind: 'number', name: 'coldTemp', labelKey: 'legionella.coldTemp' },
    { kind: 'number', name: 'cfu', labelKey: 'legionella.cfu' },
    { kind: 'textarea', name: 'measures', labelKey: 'legionella.measures', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (check) =>
    [check.number, check.title, check.system, check.measuringPoint, check.responsible]
      .filter(Boolean)
      .join(' '),
};

const rcdConfig: ModuleConfig<'rcd'> = {
  collection: 'rcd',
  titleOf: (check) => check.title || check.device || check.number,
  statusField: 'status',
  statusOptions: RCD_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: RCD_STATUS_OPTIONS, filter: true },
    { kind: 'select', name: 'result', labelKey: 'rcd.result', options: RCD_RESULT_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    text('distribution', 'rcd.distribution'),
    text('device', 'rcd.device'),
    {
      kind: 'date',
      name: 'date',
      labelKey: 'rcd.testDate',
      applyChange: (value, values) => withNextDate({ ...values, date: value }),
    },
    text('tester', 'rcd.tester'),
    {
      kind: 'select',
      name: 'interval',
      labelKey: 'legionella.interval',
      options: INTERVAL_OPTIONS,
      filter: true,
      applyChange: (value, values) => withNextDate({ ...values, interval: value }),
    },
    { kind: 'date', name: 'nextDate', labelKey: 'rcd.nextControl' },
    { kind: 'number', name: 'ratedCurrent', labelKey: 'rcd.ratedCurrent' },
    { kind: 'number', name: 'tripCurrent', labelKey: 'rcd.tripCurrent' },
    { kind: 'number', name: 'tripTime', labelKey: 'rcd.tripTime' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (check) =>
    [check.number, check.title, check.device, check.distribution, check.tester]
      .filter(Boolean)
      .join(' '),
};

const inspectionsConfig: ModuleConfig<'inspections'> = {
  collection: 'inspections',
  titleOf: (check) => check.title || check.customType || check.number,
  statusField: 'status',
  statusOptions: RCD_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'type',
      labelKey: 'inspection.kind',
      options: INSPECTION_TYPE_OPTIONS,
      filter: true,
    },
    text('customType', 'inspection.customType', {
      visibleWhen: (values) => values.type === 'custom',
    }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: RCD_STATUS_OPTIONS, filter: true },
    { kind: 'select', name: 'result', labelKey: 'rcd.result', options: RCD_RESULT_OPTIONS, filter: true },
    {
      kind: 'relation',
      name: 'propertyId',
      labelKey: 'module.properties.singular',
      collection: 'properties',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    {
      kind: 'date',
      name: 'date',
      labelKey: 'rcd.testDate',
      applyChange: (value, values) => withNextDate({ ...values, date: value }),
    },
    text('tester', 'rcd.tester'),
    { kind: 'relation', name: 'supplierId', labelKey: 'module.suppliers.singular', collection: 'suppliers' },
    {
      kind: 'select',
      name: 'interval',
      labelKey: 'legionella.interval',
      options: INTERVAL_OPTIONS,
      filter: true,
      applyChange: (value, values) => withNextDate({ ...values, interval: value }),
    },
    { kind: 'date', name: 'nextDate', labelKey: 'rcd.nextControl' },
    { kind: 'relation', name: 'assigneeUserId', labelKey: 'user.assignee', collection: 'users' },
    { kind: 'textarea', name: 'measures', labelKey: 'legionella.measures', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (check) =>
    [check.number, check.title, check.customType, check.tester].filter(Boolean).join(' '),
};

const keysConfig: ModuleConfig<'keys'> = {
  collection: 'keys',
  titleOf: (key) => key.title || key.keyNumber || key.number,
  statusField: 'status',
  statusOptions: KEY_STATUS_OPTIONS,
  fields: [
    text('title', 'keys.name', { required: true, span: 2 }),
    text('keyNumber', 'keys.keyNumber'),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: KEY_STATUS_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    text('location', 'keys.location'),
    text('issuedTo', 'keys.issuedTo'),
    { kind: 'date', name: 'issuedAt', labelKey: 'keys.issuedAt' },
    { kind: 'date', name: 'returnedAt', labelKey: 'keys.returnedAt' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (key) =>
    [key.number, key.title, key.keyNumber, key.location, key.issuedTo].filter(Boolean).join(' '),
};

const stockConfig: ModuleConfig<'stock'> = {
  collection: 'stock',
  titleOf: (item) => item.title || item.articleNumber || item.number,
  fields: [
    text('title', 'stock.material', { required: true, span: 2 }),
    text('articleNumber', 'stock.articleNumber'),
    { kind: 'number', name: 'quantity', labelKey: 'stock.quantity' },
    { kind: 'number', name: 'minQuantity', labelKey: 'stock.minQuantity' },
    text('unit', 'stock.unit'),
    text('location', 'stock.location'),
    { kind: 'relation', name: 'supplierId', labelKey: 'module.suppliers.singular', collection: 'suppliers', filter: true },
    { kind: 'number', name: 'price', labelKey: 'stock.price' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (item) =>
    [item.number, item.title, item.articleNumber, item.location].filter(Boolean).join(' '),
};

const contractsConfig: ModuleConfig<'contracts'> = {
  collection: 'contracts',
  titleOf: (contract) => contract.title || contract.partner || contract.number,
  statusField: 'status',
  statusOptions: CONTRACT_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    text('partner', 'contracts.partner', { required: true }),
    { kind: 'select', name: 'type', labelKey: 'contracts.type', options: CONTRACT_TYPE_OPTIONS, filter: true },
    text('contractNumber', 'contracts.contractNumber'),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: CONTRACT_STATUS_OPTIONS, filter: true },
    { kind: 'date', name: 'start', labelKey: 'contracts.start' },
    { kind: 'date', name: 'end', labelKey: 'contracts.end' },
    { kind: 'select', name: 'noticeMonths', labelKey: 'contracts.notice', options: NOTICE_PERIOD_OPTIONS },
    { kind: 'money', name: 'cost', labelKey: 'contracts.cost' },
    { kind: 'relation', name: 'supplierId', labelKey: 'module.suppliers.singular', collection: 'suppliers', filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers' },
    { kind: 'relation', name: 'propertyId', labelKey: 'contracts.location', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (contract) =>
    [contract.number, contract.title, contract.partner, contract.contractNumber]
      .filter(Boolean)
      .join(' '),
};

const damagesConfig: ModuleConfig<'damages'> = {
  collection: 'damages',
  titleOf: (damage) => damage.title || damage.number,
  statusField: 'status',
  statusOptions: DAMAGE_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: DAMAGE_STATUS_OPTIONS, filter: true },
    { kind: 'select', name: 'priority', labelKey: 'common.priority', options: PRIORITY_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    text('reportedBy', 'common.author'),
    {
      kind: 'relation',
      name: 'reportedById',
      labelKey: 'user.reporter',
      collection: 'users',
    },
    {
      kind: 'relation',
      name: 'assigneeUserId',
      labelKey: 'user.assignee',
      collection: 'users',
      filter: true,
    },
    text('assigneeTeam', 'user.team'),
    { kind: 'date', name: 'reportedAt', labelKey: 'common.date' },
    { kind: 'money', name: 'estimatedCost', labelKey: 'common.amount' },
    { kind: 'switch', name: 'insuranceCase', labelKey: 'common.type' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (damage) =>
    [damage.number, damage.title, damage.description, damage.reportedBy].filter(Boolean).join(' '),
};

const reportsConfig: ModuleConfig<'reports'> = {
  collection: 'reports',
  titleOf: (report) => report.title || report.number,
  statusField: 'status',
  statusOptions: REPORT_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'type', labelKey: 'common.type', options: REPORT_TYPE_OPTIONS, filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: REPORT_STATUS_OPTIONS, filter: true },
    { kind: 'date', name: 'date', labelKey: 'common.date' },
    text('author', 'common.author'),
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties' },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    { kind: 'relation', name: 'orderId', labelKey: 'module.orders.singular', collection: 'orders' },
    text('workStart', 'work.start'),
    text('workEnd', 'work.end'),
    { kind: 'number', name: 'breakMinutes', labelKey: 'work.break' },
    { kind: 'textarea', name: 'summary', labelKey: 'common.summary', span: 2 },
    { kind: 'textarea', name: 'workDescription', labelKey: 'report.work', span: 2 },
  ],
  searchOf: (report) =>
    [report.number, report.title, report.summary, report.author].filter(Boolean).join(' '),
};

const quotesConfig: ModuleConfig<'quotes'> = {
  collection: 'quotes',
  titleOf: (quote) => quote.title || quote.number,
  statusField: 'status',
  statusOptions: QUOTE_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: QUOTE_STATUS_OPTIONS, filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', required: true, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties' },
    { kind: 'date', name: 'date', labelKey: 'common.date' },
    { kind: 'date', name: 'validUntil', labelKey: 'invoice.validUntil' },
    { kind: 'textarea', name: 'introText', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (quote) => [quote.number, quote.title].filter(Boolean).join(' '),
};

const invoicesConfig: ModuleConfig<'invoices'> = {
  collection: 'invoices',
  titleOf: (invoice) => invoice.title || invoice.number,
  statusField: 'status',
  statusOptions: INVOICE_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    { kind: 'select', name: 'status', labelKey: 'common.status', options: INVOICE_STATUS_OPTIONS, filter: true },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers', required: true, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties' },
    { kind: 'relation', name: 'orderId', labelKey: 'module.orders.singular', collection: 'orders' },
    { kind: 'relation', name: 'quoteId', labelKey: 'module.quotes.singular', collection: 'quotes' },
    { kind: 'relation', name: 'reportId', labelKey: 'module.reports.singular', collection: 'reports' },
    { kind: 'date', name: 'date', labelKey: 'common.date' },
    { kind: 'date', name: 'dueDate', labelKey: 'invoice.dueDate' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (invoice) => [invoice.number, invoice.title].filter(Boolean).join(' '),
};

/** Der naechste Termin eines Plans liegt nie vor dem Startdatum. */
const withNextCleaning = (values: FormValues): FormValues => {
  const start = asString(values.startDate);
  if (!start) return values;
  const next = asString(values.nextDate);
  return next && next >= start ? values : { ...values, nextDate: start };
};

const cleaningAreasConfig: ModuleConfig<'cleaningareas'> = {
  collection: 'cleaningareas',
  titleOf: (area) => area.name || area.number,
  statusField: 'status',
  statusOptions: ACTIVE_OPTIONS,
  fields: [
    text('name', 'cleaning.areaName', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'type',
      labelKey: 'cleaning.areaTypeLabel',
      options: CLEANING_AREA_TYPE_OPTIONS,
      filter: true,
    },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ACTIVE_OPTIONS, filter: true },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties', filter: true },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    text('location', 'cleaning.location'),
    { kind: 'number', name: 'area', labelKey: 'cleaning.areaSize' },
    {
      kind: 'relation',
      name: 'responsibleId',
      labelKey: 'cleaning.responsible',
      collection: 'cleaners',
      filter: true,
    },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (area) =>
    [area.number, area.name, area.location, area.description].filter(Boolean).join(' '),
};

const cleanersConfig: ModuleConfig<'cleaners'> = {
  collection: 'cleaners',
  titleOf: (cleaner) =>
    [cleaner.firstName, cleaner.name].filter(Boolean).join(' ') || cleaner.number,
  statusField: 'status',
  statusOptions: ACTIVE_OPTIONS,
  fields: [
    text('firstName', 'customer.firstName'),
    text('name', 'customer.lastName', { required: true }),
    { kind: 'select', name: 'role', labelKey: 'cleaning.roleLabel', options: CLEANER_ROLE_OPTIONS, filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: ACTIVE_OPTIONS, filter: true },
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'tel', name: 'mobile', labelKey: 'common.mobile' },
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    {
      kind: 'relation',
      name: 'supplierId',
      labelKey: 'cleaning.company',
      collection: 'suppliers',
      filter: true,
    },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (cleaner) =>
    [cleaner.number, cleaner.firstName, cleaner.name, cleaner.email, cleaner.phone]
      .filter(Boolean)
      .join(' '),
};

const cleaningPlansConfig: ModuleConfig<'cleaningplans'> = {
  collection: 'cleaningplans',
  titleOf: (plan) => plan.title || plan.number,
  statusField: 'status',
  statusOptions: CLEANING_PLAN_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'relation',
      name: 'areaId',
      labelKey: 'module.cleaningareas.singular',
      collection: 'cleaningareas',
      required: true,
      filter: true,
    },
    {
      kind: 'select',
      name: 'status',
      labelKey: 'common.status',
      options: CLEANING_PLAN_STATUS_OPTIONS,
      filter: true,
    },
    {
      kind: 'select',
      name: 'interval',
      labelKey: 'cleaning.intervalLabel',
      options: CLEANING_INTERVAL_OPTIONS,
      filter: true,
    },
    {
      kind: 'number',
      name: 'intervalDays',
      labelKey: 'cleaning.intervalDays',
      visibleWhen: (values) => values.interval === 'custom',
    },
    {
      kind: 'relation',
      name: 'cleanerId',
      labelKey: 'cleaning.assignee',
      collection: 'cleaners',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'responsibleId',
      labelKey: 'cleaning.responsible',
      collection: 'cleaners',
    },
    {
      kind: 'relation',
      name: 'assigneeUserId',
      labelKey: 'user.assignee',
      collection: 'users',
      filter: true,
    },
    text('assigneeTeam', 'user.team'),
    {
      kind: 'date',
      name: 'startDate',
      labelKey: 'cleaning.startDate',
      applyChange: (value, values) => withNextCleaning({ ...values, startDate: value }),
    },
    { kind: 'date', name: 'nextDate', labelKey: 'cleaning.nextDate' },
    text('timeStart', 'cleaning.timeStart'),
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (plan) => [plan.number, plan.title, plan.notes].filter(Boolean).join(' '),
};

const cleaningTasksConfig: ModuleConfig<'cleaningtasks'> = {
  collection: 'cleaningtasks',
  titleOf: (task) => task.title || task.number,
  statusField: 'status',
  statusOptions: CLEANING_TASK_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'status',
      labelKey: 'common.status',
      options: CLEANING_TASK_STATUS_OPTIONS,
      filter: true,
    },
    { kind: 'date', name: 'date', labelKey: 'common.date' },
    {
      kind: 'relation',
      name: 'areaId',
      labelKey: 'module.cleaningareas.singular',
      collection: 'cleaningareas',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'cleanerId',
      labelKey: 'cleaning.assignee',
      collection: 'cleaners',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'responsibleId',
      labelKey: 'cleaning.responsible',
      collection: 'cleaners',
    },
    {
      kind: 'relation',
      name: 'assigneeUserId',
      labelKey: 'user.assignee',
      collection: 'users',
      filter: true,
    },
    text('assigneeTeam', 'user.team'),
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties' },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    {
      kind: 'relation',
      name: 'planId',
      labelKey: 'module.cleaningplans.singular',
      collection: 'cleaningplans',
    },
    text('workStart', 'work.start'),
    text('workEnd', 'work.end'),
    { kind: 'number', name: 'breakMinutes', labelKey: 'work.break' },
    { kind: 'textarea', name: 'notes', labelKey: 'cleaning.remarks', span: 2 },
  ],
  searchOf: (task) => [task.number, task.title, task.notes].filter(Boolean).join(' '),
};

const cleaningChecksConfig: ModuleConfig<'cleaningchecks'> = {
  collection: 'cleaningchecks',
  titleOf: (check) => check.title || check.number,
  statusField: 'result',
  statusOptions: CLEANING_CHECK_RESULT_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'result',
      labelKey: 'cleaning.result',
      options: CLEANING_CHECK_RESULT_OPTIONS,
      filter: true,
    },
    { kind: 'date', name: 'date', labelKey: 'common.date' },
    {
      kind: 'relation',
      name: 'areaId',
      labelKey: 'module.cleaningareas.singular',
      collection: 'cleaningareas',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'taskId',
      labelKey: 'module.cleaningtasks.singular',
      collection: 'cleaningtasks',
    },
    {
      kind: 'relation',
      name: 'inspectorId',
      labelKey: 'cleaning.inspector',
      collection: 'cleaners',
      filter: true,
    },
    text('inspector', 'cleaning.inspectorName'),
    { kind: 'number', name: 'rating', labelKey: 'cleaning.rating' },
    { kind: 'textarea', name: 'measures', labelKey: 'cleaning.measures', span: 2 },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (check) =>
    [check.number, check.title, check.inspector, check.measures].filter(Boolean).join(' '),
};

const cleaningComplaintsConfig: ModuleConfig<'cleaningcomplaints'> = {
  collection: 'cleaningcomplaints',
  titleOf: (complaint) => complaint.title || complaint.number,
  statusField: 'status',
  statusOptions: CLEANING_COMPLAINT_STATUS_OPTIONS,
  fields: [
    text('title', 'common.title', { required: true, span: 2 }),
    {
      kind: 'select',
      name: 'status',
      labelKey: 'common.status',
      options: CLEANING_COMPLAINT_STATUS_OPTIONS,
      filter: true,
    },
    { kind: 'select', name: 'priority', labelKey: 'common.priority', options: PRIORITY_OPTIONS, filter: true },
    {
      kind: 'relation',
      name: 'areaId',
      labelKey: 'module.cleaningareas.singular',
      collection: 'cleaningareas',
      filter: true,
    },
    {
      kind: 'relation',
      name: 'taskId',
      labelKey: 'module.cleaningtasks.singular',
      collection: 'cleaningtasks',
    },
    { kind: 'relation', name: 'customerId', labelKey: 'module.customers.singular', collection: 'customers' },
    { kind: 'relation', name: 'propertyId', labelKey: 'module.properties.singular', collection: 'properties' },
    {
      kind: 'relation',
      name: 'buildingId',
      labelKey: 'module.buildings.singular',
      collection: 'buildings',
      parentValueField: 'propertyId',
      parentKey: 'propertyId',
    },
    {
      kind: 'relation',
      name: 'roomId',
      labelKey: 'module.rooms.singular',
      collection: 'rooms',
      parentValueField: 'buildingId',
      parentKey: 'buildingId',
    },
    text('reportedBy', 'cleaning.reportedBy'),
    { kind: 'date', name: 'reportedAt', labelKey: 'cleaning.reportedAt' },
    {
      kind: 'relation',
      name: 'assignedId',
      labelKey: 'cleaning.assignee',
      collection: 'cleaners',
      filter: true,
    },
    { kind: 'date', name: 'resolvedAt', labelKey: 'cleaning.resolvedAt' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
    { kind: 'textarea', name: 'resolution', labelKey: 'cleaning.resolution', span: 2 },
  ],
  searchOf: (complaint) =>
    [complaint.number, complaint.title, complaint.description, complaint.reportedBy]
      .filter(Boolean)
      .join(' '),
};

const usersConfig: ModuleConfig<'users'> = {
  collection: 'users',
  titleOf: (user) => user.name || user.email || user.number,
  statusField: 'status',
  statusOptions: USER_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
    { kind: 'email', name: 'email', labelKey: 'common.email' },
    { kind: 'tel', name: 'phone', labelKey: 'common.phone' },
    { kind: 'select', name: 'role', labelKey: 'settings.role', options: USER_ROLE_OPTIONS, filter: true },
    { kind: 'select', name: 'status', labelKey: 'common.status', options: USER_STATUS_OPTIONS, filter: true },
    {
      kind: 'relation',
      name: 'organizationId',
      labelKey: 'module.organizations.singular',
      collection: 'organizations',
      filter: true,
    },
    text('team', 'user.team'),
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (user) =>
    [user.number, user.name, user.email, user.team, user.role].filter(Boolean).join(' '),
};

/**
 * Aktivitaetshistorie.
 *
 * Die Eintraege entstehen nur durch die Anwendung; die Felder sind deshalb
 * ausschliesslich zur Anzeige beschrieben.
 */
const activitiesConfig: ModuleConfig<'activities'> = {
  collection: 'activities',
  titleOf: (activity) => activity.entityTitle || activity.entityNumber || activity.number,
  fields: [
    text('entityTitle', 'common.title', { span: 2 }),
    text('userName', 'activity.user'),
    { kind: 'text', name: 'entityNumber', labelKey: 'common.number' },
  ],
  searchOf: (activity) =>
    [activity.entityNumber, activity.entityTitle, activity.userName, activity.module]
      .filter(Boolean)
      .join(' '),
};

export const MODULE_CONFIGS: { [K in CollectionKey]: ModuleConfig<K> } = {
  customers: customersConfig,
  suppliers: suppliersConfig,
  organizations: organizationsConfig,
  sites: sitesConfig,
  properties: propertiesConfig,
  buildings: buildingsConfig,
  rooms: roomsConfig,
  assets: assetsConfig,
  documents: documentsConfig,
  energy: energyConfig,
  orders: ordersConfig,
  maintenances: maintenancesConfig,
  legionella: legionellaConfig,
  rcd: rcdConfig,
  inspections: inspectionsConfig,
  keys: keysConfig,
  stock: stockConfig,
  contracts: contractsConfig,
  damages: damagesConfig,
  reports: reportsConfig,
  quotes: quotesConfig,
  invoices: invoicesConfig,
  cleaningareas: cleaningAreasConfig,
  cleaners: cleanersConfig,
  cleaningplans: cleaningPlansConfig,
  cleaningtasks: cleaningTasksConfig,
  cleaningchecks: cleaningChecksConfig,
  cleaningcomplaints: cleaningComplaintsConfig,
  users: usersConfig,
  activities: activitiesConfig,
};

export const configOf = <K extends CollectionKey>(collection: K): ModuleConfig<K> =>
  MODULE_CONFIGS[collection];

/** Titel eines beliebigen Datensatzes; genutzt von Auswahlfeldern und Verweisen. */
export const titleOfEntity = (collection: CollectionKey, entity: BaseEntity): string => {
  const titleOf = MODULE_CONFIGS[collection].titleOf as (value: BaseEntity) => string;
  return titleOf(entity);
};
