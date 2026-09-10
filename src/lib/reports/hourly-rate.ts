import { AppSettings, AppUser, Supplier, UserRole } from '@/lib/types';

export const hourlyRateFor = ({
  explicit,
  user,
  supplier,
  settings,
}: {
  explicit?: number;
  user?: AppUser;
  supplier?: Supplier;
  settings: AppSettings;
}): number => {
  if (typeof explicit === 'number' && explicit >= 0) return explicit;
  if (typeof user?.hourlyRate === 'number' && user.hourlyRate >= 0) return user.hourlyRate;
  if (typeof supplier?.hourlyRate === 'number' && supplier.hourlyRate >= 0) return supplier.hourlyRate;
  if (user) {
    const roleRate = settings.roleHourlyRates?.[user.role as UserRole];
    if (typeof roleRate === 'number' && roleRate >= 0) return roleRate;
  }
  return 0;
};
