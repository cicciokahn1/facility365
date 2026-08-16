/**
 * Beschreibung aller Datenmodule.
 *
 * Jedes Modul besteht aus denselben Bausteinen: Titel, Status, Felder und
 * Suchtext. Uebersicht, Formular und Detailansicht werden daraus erzeugt.
 */
import { TranslationKey } from '@/lib/i18n/dictionary';
import {
  ACTIVE_OPTIONS,
  ASSET_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  DAMAGE_STATUS_OPTIONS,
  FieldDef,
  INTERVAL_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  REPORT_STATUS_OPTIONS,
  REPORT_TYPE_OPTIONS,
  SelectOption,
} from '@/lib/schema';
import { BaseEntity, CollectionKey, EntityOf } from '@/lib/types';

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

const propertiesConfig: ModuleConfig<'properties'> = {
  collection: 'properties',
  titleOf: (property) => property.name || property.number,
  statusField: 'status',
  statusOptions: PROPERTY_STATUS_OPTIONS,
  fields: [
    text('name', 'common.name', { required: true, span: 2 }),
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
    text('category', 'common.category'),
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
    text('category', 'common.category'),
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
    { kind: 'relation', name: 'assetId', labelKey: 'module.assets.singular', collection: 'assets' },
    { kind: 'textarea', name: 'notes', labelKey: 'common.notes', span: 2 },
  ],
  searchOf: (document) =>
    [document.number, document.title, document.category, document.file?.name].filter(Boolean).join(' '),
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
    text('assignee', 'common.assignee'),
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
    text('company', 'settings.company'),
    text('responsible', 'common.responsible'),
    { kind: 'date', name: 'lastDate', labelKey: 'common.date' },
    { kind: 'date', name: 'nextDate', labelKey: 'common.dueDate' },
    { kind: 'textarea', name: 'description', labelKey: 'common.description', span: 2 },
  ],
  searchOf: (maintenance) =>
    [maintenance.number, maintenance.title, maintenance.company, maintenance.responsible]
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

export const MODULE_CONFIGS: { [K in CollectionKey]: ModuleConfig<K> } = {
  customers: customersConfig,
  properties: propertiesConfig,
  buildings: buildingsConfig,
  rooms: roomsConfig,
  assets: assetsConfig,
  documents: documentsConfig,
  orders: ordersConfig,
  maintenances: maintenancesConfig,
  damages: damagesConfig,
  reports: reportsConfig,
  quotes: quotesConfig,
  invoices: invoicesConfig,
};

export const configOf = <K extends CollectionKey>(collection: K): ModuleConfig<K> =>
  MODULE_CONFIGS[collection];

/** Titel eines beliebigen Datensatzes; genutzt von Auswahlfeldern und Verweisen. */
export const titleOfEntity = (collection: CollectionKey, entity: BaseEntity): string => {
  const titleOf = MODULE_CONFIGS[collection].titleOf as (value: BaseEntity) => string;
  return titleOf(entity);
};
