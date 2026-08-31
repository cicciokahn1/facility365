/**
 * Berechtigungen von Facility365.
 *
 * Eine einzige Tabelle bestimmt, welche Rolle welches Modul sehen und
 * bearbeiten darf. Der Umfang (welche Organisation, welche Standorte, nur
 * eigene Zuweisungen) steht im Benutzerdatensatz und wird hier zu einem
 * «Zugriffsraum» verdichtet, den jede Ansicht gleich auswertet.
 *
 * Ohne gepflegten Benutzer gilt der volle Zugriff: bestehende Installationen
 * ohne Benutzerverwaltung verhalten sich unveraendert.
 */
import { AppUser, ModuleKey, UserRole } from '@/lib/types';

/** Zugriffstiefe je Modul. */
export type Access = 'none' | 'read' | 'write';

interface RoleAccess {
  /** Zugriff auf alle Module, die unten nicht eigens genannt sind. */
  fallback: Access;
  modules: Partial<Record<ModuleKey, Access>>;
  /** Zugriff auf alle Organisationen statt nur auf die eigene. */
  allOrganizations: boolean;
  /** Zugriff auf alle Standorte statt nur auf die zugewiesenen. */
  allSites: boolean;
  /** Nur Datensaetze, die der Person zugewiesen sind oder von ihr stammen. */
  ownOnly: boolean;
  /** Darf Benutzer anlegen, bearbeiten und deaktivieren. */
  manageUsers: boolean;
}

/** Module, die jede angemeldete Person sieht. */
const COMMON: Partial<Record<ModuleKey, Access>> = {
  dashboard: 'read',
  today: 'read',
  settings: 'read',
  /** Das Kundenportal zeigt nur freigegebene Daten und die eigenen Offerten. */
  portal: 'write',
};

const ROLES: Record<UserRole, RoleAccess> = {
  superadmin: {
    fallback: 'write',
    modules: {},
    allOrganizations: true,
    allSites: true,
    ownOnly: false,
    manageUsers: true,
  },
  orgadmin: {
    fallback: 'write',
    modules: {},
    allOrganizations: false,
    allSites: true,
    ownOnly: false,
    manageUsers: true,
  },
  sitemanager: {
    fallback: 'write',
    modules: { ...COMMON, users: 'read', activities: 'read' },
    allOrganizations: false,
    allSites: false,
    ownOnly: false,
    manageUsers: false,
  },
  caretaker: {
    fallback: 'read',
    modules: {
      ...COMMON,
      orders: 'write',
      maintenances: 'write',
      damages: 'write',
      reports: 'write',
      legionella: 'write',
      rcd: 'write',
      inspections: 'write',
      keys: 'write',
      inventory: 'write',
      vehicles: 'write',
      tools: 'write',
      stock: 'write',
      sources: 'write',
      solarplants: 'write',
      solaryields: 'write',
      cleaningchecks: 'write',
      cleaningcomplaints: 'write',
      quotes: 'none',
      invoices: 'none',
      contracts: 'none',
      customers: 'none',
      users: 'none',
      activities: 'none',
    },
    allOrganizations: false,
    allSites: false,
    ownOnly: false,
    manageUsers: false,
  },
  cleaner: {
    fallback: 'none',
    modules: {
      ...COMMON,
      cleaning: 'read',
      cleaningtasks: 'write',
      cleaningareas: 'read',
      cleaningplans: 'read',
      cleaningcomplaints: 'read',
    },
    allOrganizations: false,
    allSites: false,
    ownOnly: true,
    manageUsers: false,
  },
  reporter: {
    fallback: 'none',
    modules: { ...COMMON, damages: 'write' },
    allOrganizations: false,
    allSites: false,
    ownOnly: true,
    manageUsers: false,
  },
  external: {
    fallback: 'none',
    modules: { ...COMMON, orders: 'write', reports: 'write', documents: 'read' },
    allOrganizations: false,
    allSites: false,
    ownOnly: true,
    manageUsers: false,
  },
  reader: {
    fallback: 'read',
    modules: {
      ...COMMON,
      quotes: 'none',
      invoices: 'none',
      contracts: 'none',
      users: 'none',
      activities: 'none',
    },
    allOrganizations: false,
    allSites: false,
    ownOnly: false,
    manageUsers: false,
  },
};

/** Zugriffsraum einer Sitzung; ohne Benutzer der volle Zugriff. */
export interface AccessScope {
  user: AppUser | null;
  role: UserRole;
  active: boolean;
  organizationId: string;
  /** Zugewiesene Standorte; leer bedeutet «alle erlaubten». */
  siteIds: string[];
  allOrganizations: boolean;
  allSites: boolean;
  ownOnly: boolean;
  manageUsers: boolean;
}

/** Voller Zugriff, solange keine Benutzerverwaltung gepflegt ist. */
export const FULL_SCOPE: AccessScope = {
  user: null,
  role: 'superadmin',
  active: true,
  organizationId: '',
  siteIds: [],
  allOrganizations: true,
  allSites: true,
  ownOnly: false,
  manageUsers: true,
};

export const scopeOf = (user: AppUser | null): AccessScope => {
  if (!user) return FULL_SCOPE;
  const role = ROLES[user.role];
  return {
    user,
    role: user.role,
    active: user.status === 'active',
    organizationId: user.organizationId,
    siteIds: user.siteIds ?? [],
    allOrganizations: role.allOrganizations,
    allSites: role.allSites,
    ownOnly: role.ownOnly,
    manageUsers: role.manageUsers,
  };
};

/** Zugriffstiefe einer Rolle auf ein Modul. */
export const moduleAccess = (scope: AccessScope, module: ModuleKey): Access => {
  /** Deaktivierte Benutzer haben keinen Zugriff - auch nicht lesend. */
  if (!scope.active) return 'none';
  const role = ROLES[scope.role];
  return role.modules[module] ?? role.fallback;
};

export const canRead = (scope: AccessScope, module: ModuleKey): boolean =>
  moduleAccess(scope, module) !== 'none';

export const canWrite = (scope: AccessScope, module: ModuleKey): boolean =>
  moduleAccess(scope, module) === 'write';

/** Loeschen ist enger als Schreiben: nur Verwaltungsrollen duerfen es. */
export const canDelete = (scope: AccessScope, module: ModuleKey): boolean =>
  canWrite(scope, module) &&
  (scope.role === 'superadmin' || scope.role === 'orgadmin' || scope.role === 'sitemanager');

export const canManageUsers = (scope: AccessScope): boolean => scope.active && scope.manageUsers;
