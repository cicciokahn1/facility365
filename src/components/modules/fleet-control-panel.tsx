'use client';

import { useMemo } from 'react';
import { CheckCircle2, ClipboardCheck, Gauge, Handshake, Plus, RotateCcw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import type { ChecklistItem, Tool, Vehicle, VehicleHandover, VehicleInspection } from '@/lib/types';
import { calculatedNextService, serviceHoursDue } from '@/lib/fleet/maintenance';
import { formatDate } from '@/lib/utils/format';
import { useSettings } from '@/lib/settings/provider';

type FleetEntity = Vehicle | Tool;

export function FleetControlPanel<T extends FleetEntity>({
  entity,
  onChange,
}: {
  entity: T;
  onChange: (values: Partial<T>, action?: string) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const checklist = entity.inspectionChecklist ?? [];
  const nextService = calculatedNextService(entity);
  const inspections = entity.inspections ?? [];
  const handovers = entity.handovers ?? [];

  const toggleChecklist = (item: ChecklistItem) => {
    onChange(
      { inspectionChecklist: checklist.map((entry) => (entry.id === item.id ? { ...entry, done: !entry.done } : entry)) } as Partial<T>,
      'fleet.checklistUpdated',
    );
  };

  const addInspection = () => {
    const inspection: VehicleInspection = {
      id: `inspection-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      inspector: settings.profileName || '',
      result: 'pending',
      checklist,
      note: '',
    };
    onChange({ inspections: [...inspections, inspection] } as Partial<T>, 'fleet.inspectionAdded');
  };

  const addHandover = (type: VehicleHandover['type']) => {
    const handover: VehicleHandover = {
      id: `handover-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type,
      person: settings.profileName || '',
      mileage: 'mileage' in entity ? entity.mileage : undefined,
      operatingHours: entity.operatingHours,
      note: '',
    };
    onChange({ handovers: [...handovers, handover] } as Partial<T>, 'fleet.handoverAdded');
  };

  const checklistLabel = useMemo(
    () => `${checklist.filter((item) => item.done).length}/${checklist.length}`,
    [checklist],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4 text-primary" aria-hidden />
            {t('fleet.operatingData')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoRow label={t('vehicle.operatingHours')} value={entity.operatingHours ? `${entity.operatingHours} h` : '–'} />
          <InfoRow label={t('vehicle.fuelConsumption')} value={entity.fuelConsumption ? `${entity.fuelConsumption} ${entity.fuelUnit || ''}` : '–'} />
          <InfoRow label={t('vehicle.nextService')} value={nextService ? formatDate(nextService, settings.language) : '–'} />
          <InfoRow label={t('fleet.serviceHoursDue')} value={serviceHoursDue(entity) ? t('fleet.due') : t('fleet.notDue')} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4 text-primary" aria-hidden />
            {t('fleet.checklist')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{checklistLabel}</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('fleet.noChecklist')}</p>
          ) : (
            checklist.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-muted"
                onClick={() => toggleChecklist(item)}
              >
                <CheckCircle2 className={`size-4 ${item.done ? 'text-green-600' : 'text-muted-foreground'}`} aria-hidden />
                <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
              </button>
            ))
          )}
          <Button variant="outline" size="sm" onClick={addInspection}>
            <Plus className="size-4" aria-hidden />
            {t('fleet.recordInspection')}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="size-4 text-primary" aria-hidden />
            {t('fleet.handover')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addHandover('handover')}>
              <Handshake className="size-4" aria-hidden />
              {t('fleet.handoverOut')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => addHandover('return')}>
              <RotateCcw className="size-4" aria-hidden />
              {t('fleet.handoverIn')}
            </Button>
          </div>
          {handovers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('fleet.noHandovers')}</p>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {handovers.slice().reverse().map((handover) => (
                <li key={handover.id} className="flex flex-wrap justify-between gap-2 p-2">
                  <span>{handover.type === 'handover' ? t('fleet.handoverOut') : t('fleet.handoverIn')}</span>
                  <span className="text-muted-foreground">
                    {formatDate(handover.date, settings.language)} · {handover.person || '–'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
