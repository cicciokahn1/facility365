import type { Tool, Vehicle } from '@/lib/types';

export type FleetEntity = Vehicle | Tool;

export function calculatedNextService(entity: FleetEntity): string {
  if (entity.nextService) return entity.nextService;
  if (!entity.lastService) return '';
  const months = 'serviceIntervalMonths' in entity ? entity.serviceIntervalMonths ?? 0 : 0;
  if (months <= 0) return '';
  const next = new Date(`${entity.lastService}T12:00:00`);
  if (Number.isNaN(next.getTime())) return '';
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

export function serviceHoursDue(entity: FleetEntity): boolean {
  if (!entity.serviceIntervalHours || !entity.operatingHours) return false;
  const last = 'lastServiceHours' in entity ? entity.lastServiceHours ?? 0 : 0;
  return last > 0 && entity.operatingHours >= last + entity.serviceIntervalHours;
}
