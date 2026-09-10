/**
 * Modulverzeichnis.
 *
 * Eine einzige Liste bestimmt Navigation, Adressen, Symbole und Gruppierung.
 * Ein neues Modul wird hier eingetragen und erscheint ueberall - in der
 * Seitenleiste, in der Telefonnavigation und in der globalen Suche.
 */
import {
  Boxes,
  Brush,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  DoorClosed,
  Droplets,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Files,
  Gauge,
  Handshake,
  Headset,
  Home,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  MailPlus,
  MapPin,
  MessageSquareWarning,
  Network,
  PackageSearch,
  type LucideIcon,
  Receipt,
  Settings,
  Sun,
  SunMedium,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  SprayCan,
  Star,
  FlameKindling,
  ToyBrick,
  Trash2,
  Truck,
  UserCog,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import type { TranslationKey } from "@/lib/i18n/dictionary";
import { CollectionKey, ModuleKey } from "@/lib/types";

/**
 * Hauptordner der Navigation. `overview` steht ohne Ordner zuoberst, alle
 * uebrigen Ordner klappen erst beim Oeffnen auf.
 */
export type NavGroup =
  | "overview"
  | "objects"
  | "technics"
  | "work"
  | "cleaning"
  | "energy"
  | "operations"
  | "documents"
  | "finance"
  | "analytics"
  | "users"
  | "admin";

export interface ModuleDefinition {
  key: ModuleKey;
  /** Sammlung in der Datenschicht; fehlt bei Dashboard, Berichte und Einstellungen. */
  collection?: CollectionKey;
  path: string;
  icon: LucideIcon;
  group: NavGroup;
  labelKey: TranslationKey;
  singularKey: TranslationKey;
}

export const MODULES: ModuleDefinition[] = [
  {
    key: "dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    group: "overview",
    labelKey: "module.dashboard",
    singularKey: "module.dashboard",
  },
  {
    key: "calendar",
    path: "/calendar",
    icon: CalendarDays,
    group: "overview",
    labelKey: "module.calendar",
    singularKey: "module.calendar",
  },
  {
    key: "appointments",
    collection: "appointments",
    path: "/appointments",
    icon: CalendarClock,
    group: "overview",
    labelKey: "module.appointments",
    singularKey: "module.appointments.singular",
  },
  {
    key: "today",
    path: "/today",
    icon: Sun,
    group: "overview",
    labelKey: "module.today",
    singularKey: "module.today",
  },
  {
    key: "favorites",
    path: "/favorites",
    icon: Star,
    group: "overview",
    labelKey: "module.favorites",
    singularKey: "module.favorites",
  },
  {
    key: "customers",
    collection: "customers",
    path: "/customers",
    icon: Users,
    group: "objects",
    labelKey: "module.customers",
    singularKey: "module.customers.singular",
  },
  {
    key: "suppliers",
    collection: "suppliers",
    path: "/suppliers",
    icon: Truck,
    group: "objects",
    labelKey: "module.suppliers",
    singularKey: "module.suppliers.singular",
  },
  {
    key: "sources",
    collection: "sources",
    path: "/sources",
    icon: ShoppingBag,
    group: "objects",
    labelKey: "module.sources",
    singularKey: "module.sources.singular",
  },
  {
    key: "organizations",
    collection: "organizations",
    path: "/organizations",
    icon: Network,
    group: "objects",
    labelKey: "module.organizations",
    singularKey: "module.organizations.singular",
  },
  {
    key: "sites",
    collection: "sites",
    path: "/sites",
    icon: MapPin,
    group: "objects",
    labelKey: "module.sites",
    singularKey: "module.sites.singular",
  },
  {
    key: "properties",
    collection: "properties",
    path: "/properties",
    icon: Home,
    group: "objects",
    labelKey: "module.properties",
    singularKey: "module.properties.singular",
  },
  {
    key: "buildings",
    collection: "buildings",
    path: "/buildings",
    icon: Building2,
    group: "objects",
    labelKey: "module.buildings",
    singularKey: "module.buildings.singular",
  },
  {
    key: "rooms",
    collection: "rooms",
    path: "/rooms",
    icon: DoorClosed,
    group: "objects",
    labelKey: "module.rooms",
    singularKey: "module.rooms.singular",
  },
  {
    key: "assets",
    collection: "assets",
    path: "/assets",
    icon: Boxes,
    group: "technics",
    labelKey: "module.assets",
    singularKey: "module.assets.singular",
  },
  {
    key: "documents",
    collection: "documents",
    path: "/documents",
    icon: Files,
    group: "documents",
    labelKey: "module.documents",
    singularKey: "module.documents.singular",
  },
  {
    key: "energy",
    collection: "energy",
    path: "/energy",
    icon: Gauge,
    group: "energy",
    labelKey: "module.energy",
    singularKey: "module.energy.singular",
  },
  {
    key: "solarplants",
    collection: "solarplants",
    path: "/solar",
    icon: Sun,
    group: "energy",
    labelKey: "module.solarplants",
    singularKey: "module.solarplants.singular",
  },
  {
    key: "solaryields",
    collection: "solaryields",
    path: "/solar/yields",
    icon: SunMedium,
    group: "energy",
    labelKey: "module.solaryields",
    singularKey: "module.solaryields.singular",
  },
  {
    key: "keys",
    collection: "keys",
    path: "/keys",
    icon: KeyRound,
    group: "operations",
    labelKey: "module.keys",
    singularKey: "module.keys.singular",
  },
  {
    key: "inventory",
    collection: "inventory",
    path: "/inventory",
    icon: Boxes,
    group: "operations",
    labelKey: "module.inventory",
    singularKey: "module.inventory.singular",
  },
  {
    key: "tools",
    collection: "tools",
    path: "/tools",
    icon: Wrench,
    group: "operations",
    labelKey: "module.tools",
    singularKey: "module.tools.singular",
  },
  {
    key: "vehicles",
    collection: "vehicles",
    path: "/vehicles",
    icon: Truck,
    group: "operations",
    labelKey: "module.vehicles",
    singularKey: "module.vehicles.singular",
  },
  {
    key: "stock",
    collection: "stock",
    path: "/stock",
    icon: PackageSearch,
    group: "operations",
    labelKey: "module.stock",
    singularKey: "module.stock.singular",
  },
  {
    key: "contracts",
    collection: "contracts",
    path: "/contracts",
    icon: FileSignature,
    group: "documents",
    labelKey: "module.contracts",
    singularKey: "module.contracts.singular",
  },
  {
    key: "orders",
    collection: "orders",
    path: "/orders",
    icon: ClipboardList,
    group: "work",
    labelKey: "module.orders",
    singularKey: "module.orders.singular",
  },
  {
    key: "maintenances",
    collection: "maintenances",
    path: "/maintenances",
    icon: Wrench,
    group: "technics",
    labelKey: "module.maintenances",
    singularKey: "module.maintenances.singular",
  },
  {
    key: "legionella",
    collection: "legionella",
    path: "/legionella",
    icon: Droplets,
    group: "energy",
    labelKey: "module.legionella",
    singularKey: "module.legionella.singular",
  },
  {
    key: "rcd",
    collection: "rcd",
    path: "/rcd",
    icon: Zap,
    group: "energy",
    labelKey: "module.rcd",
    singularKey: "module.rcd.singular",
  },
  {
    key: "inspections",
    collection: "inspections",
    path: "/inspections",
    icon: ClipboardCheck,
    group: "technics",
    labelKey: "module.inspections",
    singularKey: "module.inspections.singular",
  },
  {
    key: "playgroundchecks",
    collection: "playgroundchecks",
    path: "/playgrounds",
    icon: ToyBrick,
    group: "technics",
    labelKey: "module.playgroundchecks",
    singularKey: "module.playgroundchecks.singular",
  },
  {
    key: "firechecks",
    collection: "firechecks",
    path: "/firesafety",
    icon: FlameKindling,
    group: "technics",
    labelKey: "module.firechecks",
    singularKey: "module.firechecks.singular",
  },
  {
    key: "tickets",
    collection: "tickets",
    path: "/tickets",
    icon: Headset,
    group: "work",
    labelKey: "module.tickets",
    singularKey: "module.tickets.singular",
  },
  {
    key: "damages",
    collection: "damages",
    path: "/damages",
    icon: ShieldAlert,
    group: "work",
    labelKey: "module.damages",
    singularKey: "module.damages.singular",
  },
  {
    key: "reports",
    collection: "reports",
    path: "/reports",
    icon: FileText,
    group: "work",
    labelKey: "module.reports",
    singularKey: "module.reports.singular",
  },
  {
    key: "quotes",
    collection: "quotes",
    path: "/quotes",
    icon: FileSpreadsheet,
    group: "finance",
    labelKey: "module.quotes",
    singularKey: "module.quotes.singular",
  },
  {
    key: "invoices",
    collection: "invoices",
    path: "/invoices",
    icon: Receipt,
    group: "finance",
    labelKey: "module.invoices",
    singularKey: "module.invoices.singular",
  },
  {
    key: "cleaning",
    path: "/cleaning",
    icon: SprayCan,
    group: "cleaning",
    labelKey: "module.cleaning",
    singularKey: "module.cleaning",
  },
  {
    key: "cleaningtasks",
    collection: "cleaningtasks",
    path: "/cleaning/tasks",
    icon: ListChecks,
    group: "cleaning",
    labelKey: "module.cleaningtasks",
    singularKey: "module.cleaningtasks.singular",
  },
  {
    key: "cleaningplans",
    collection: "cleaningplans",
    path: "/cleaning/plans",
    icon: CalendarClock,
    group: "cleaning",
    labelKey: "module.cleaningplans",
    singularKey: "module.cleaningplans.singular",
  },
  {
    key: "cleaningareas",
    collection: "cleaningareas",
    path: "/cleaning/areas",
    icon: Brush,
    group: "cleaning",
    labelKey: "module.cleaningareas",
    singularKey: "module.cleaningareas.singular",
  },
  {
    key: "cleaners",
    collection: "cleaners",
    path: "/cleaning/staff",
    icon: Users,
    group: "cleaning",
    labelKey: "module.cleaners",
    singularKey: "module.cleaners.singular",
  },
  {
    key: "cleaningchecks",
    collection: "cleaningchecks",
    path: "/cleaning/checks",
    icon: ClipboardCheck,
    group: "cleaning",
    labelKey: "module.cleaningchecks",
    singularKey: "module.cleaningchecks.singular",
  },
  {
    key: "cleaningcomplaints",
    collection: "cleaningcomplaints",
    path: "/cleaning/complaints",
    icon: MessageSquareWarning,
    group: "cleaning",
    labelKey: "module.cleaningcomplaints",
    singularKey: "module.cleaningcomplaints.singular",
  },
  {
    key: "analytics",
    path: "/analytics",
    icon: FileSpreadsheet,
    group: "analytics",
    labelKey: "module.analytics",
    singularKey: "module.analytics",
  },
  {
    key: "audit",
    path: "/audit",
    icon: ClipboardCheck,
    group: "analytics",
    labelKey: "module.audit",
    singularKey: "module.audit",
  },
  {
    key: "handover",
    path: "/handover",
    icon: ClipboardList,
    group: "work",
    labelKey: "module.handover",
    singularKey: "module.handover",
  },
  {
    key: "portal",
    path: "/portal",
    icon: Handshake,
    group: "operations",
    labelKey: "module.portal",
    singularKey: "module.portal",
  },
  {
    key: "users",
    collection: "users",
    path: "/users",
    icon: UserCog,
    group: "users",
    labelKey: "module.users",
    singularKey: "module.users.singular",
  },
  {
    key: "activities",
    collection: "activities",
    path: "/activities",
    icon: ShieldCheck,
    group: "admin",
    labelKey: "module.activities",
    singularKey: "module.activities.singular",
  },
  {
    key: "microsoft",
    path: "/microsoft",
    icon: MailPlus,
    group: "admin",
    labelKey: "module.microsoft",
    singularKey: "module.microsoft",
  },
  {
    key: "trash",
    path: "/trash",
    icon: Trash2,
    group: "admin",
    labelKey: "module.trash",
    singularKey: "module.trash",
  },
  {
    key: "help",
    path: "/help",
    icon: LifeBuoy,
    group: "admin",
    labelKey: "module.help",
    singularKey: "module.help",
  },
  {
    key: "settings",
    path: "/settings",
    icon: Settings,
    group: "admin",
    labelKey: "module.settings",
    singularKey: "module.settings",
  },
];

export interface NavGroupDefinition {
  key: NavGroup;
  labelKey: TranslationKey;
  icon: LucideIcon;
  /** Steht ohne Ordner direkt in der Navigation. */
  flat?: boolean;
}

export const NAV_GROUPS: NavGroupDefinition[] = [
  {
    key: "overview",
    labelKey: "nav.overview",
    icon: LayoutDashboard,
    flat: true,
  },
  { key: "objects", labelKey: "nav.objects", icon: Building2 },
  { key: "technics", labelKey: "nav.technics", icon: Wrench },
  { key: "work", labelKey: "nav.work", icon: ClipboardList },
  { key: "cleaning", labelKey: "nav.cleaning", icon: SprayCan },
  { key: "energy", labelKey: "nav.energy", icon: Gauge },
  { key: "operations", labelKey: "nav.operations", icon: PackageSearch },
  { key: "documents", labelKey: "nav.documents", icon: Files },
  { key: "finance", labelKey: "nav.finance", icon: Receipt },
  { key: "analytics", labelKey: "nav.analytics", icon: FileSpreadsheet },
  { key: "users", labelKey: "nav.users", icon: UserCog },
  { key: "admin", labelKey: "nav.admin", icon: Settings },
];

/** Ordner, in dem die aufgerufene Seite liegt - fuer das automatische Aufklappen. */
export const groupOfPath = (pathname: string): NavGroup | undefined =>
  MODULES.filter(
    (module) =>
      pathname === module.path || pathname.startsWith(`${module.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0]?.group;

/** Vier Module in der Telefonnavigation; alles Weitere liegt unter «Mehr». */
export const MOBILE_NAV_KEYS: ModuleKey[] = [
  "dashboard",
  "orders",
  "damages",
  "assets",
];

export const moduleByKey = (key: ModuleKey): ModuleDefinition => {
  const found = MODULES.find((module) => module.key === key);
  if (!found) throw new Error(`Unbekanntes Modul: ${key}`);
  return found;
};

export const moduleByCollection = (
  collection: CollectionKey,
): ModuleDefinition => moduleByKey(collection);
