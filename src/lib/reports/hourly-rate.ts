import { AppSettings, AppUser, Cleaner, Supplier } from '@/lib/types';

const valid = (rate?: number): rate is number => typeof rate === 'number' && rate >= 0;

/**
 * Passender Stundenansatz: expliziter Wert im Auftrag/Rapport/Aufgabe,
 * dann Person (Benutzer oder Reinigungskraft), externe Firma, zuletzt Rolle.
 */
export const hourlyRateFor = ({
  explicit,
  user,
  cleaner,
  supplier,
  settings,
}: {
  explicit?: number;
  user?: AppUser;
  cleaner?: Cleaner;
  supplier?: Supplier;
  settings: AppSettings;
}): number => {
  if (valid(explicit)) return explicit;
  if (valid(user?.hourlyRate)) return user.hourlyRate;
  if (valid(cleaner?.hourlyRate)) return cleaner.hourlyRate;
  if (valid(supplier?.hourlyRate)) return supplier.hourlyRate;
  if (user) {
    const roleRate = settings.roleHourlyRates?.[user.role];
    if (valid(roleRate)) return roleRate;
  }
  if (cleaner) {
    const roleRate = settings.cleanerRoleHourlyRates?.[cleaner.role];
    if (valid(roleRate)) return roleRate;
  }
  return 0;
};
