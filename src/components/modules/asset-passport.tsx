'use client';

/**
 * Anlagenpass: die Übersicht, die ein Scan des QR-Codes oeffnet.
 *
 * Alle Angaben werden bei jedem Aufruf aus den aktuellen Daten gelesen; das
 * gedruckte Etikett bleibt damit dauerhaft richtig.
 */
import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';

import { StatusBadge } from '@/components/common/status-badge';
import { QuickDamageDialog } from '@/components/modules/quick-damage-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { lastMaintenanceDate, nextMaintenanceDate } from '@/lib/assets/passport';
import { ASSET_STATUS_OPTIONS } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { Asset } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils/format';

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value || '–'}</dd>
    </div>
  );
}

export function AssetPassport({
  asset,
  onChange,
}: {
  asset: Asset;
  onChange?: (values: Partial<Asset>) => void;
}) {
  const t = useT();
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const maintenances = useCollectionItems('maintenances').filter(
    (maintenance) => maintenance.assetId === asset.id,
  );

  const property = properties.find((entry) => entry.id === asset.propertyId);
  const building = buildings.find((entry) => entry.id === asset.buildingId);
  const room = rooms.find((entry) => entry.id === asset.roomId);
  const last = lastMaintenanceDate(maintenances);
  const next = nextMaintenanceDate(maintenances);
  const year = asset.manufacturedYear || asset.installedAt.slice(0, 4);
  const [reporting, setReporting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveBuilding, setMoveBuilding] = useState(asset.buildingId);
  const [moveRoom, setMoveRoom] = useState(asset.roomId);
  const [moveLocation, setMoveLocation] = useState(asset.location);
  const saveLocation = () => {
    if (!onChange || !moveBuilding || !moveRoom) return;
    const history = [
      ...(asset.locationHistory ?? []),
      {
        id: `${asset.id}-${Date.now()}`,
        date: new Date().toISOString(),
        buildingId: asset.buildingId,
        roomId: asset.roomId,
        location: asset.location,
        note: '',
      },
    ];
    onChange({ buildingId: moveBuilding, roomId: moveRoom, location: moveLocation, locationHistory: history });
    setMoving(false);
  };

  return (
    <section className="flex flex-col gap-4" data-testid="asset-passport">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{asset.name}</h2>
            <p className="font-mono text-sm text-primary" data-testid="asset-id">
              {asset.number}
            </p>
          </div>
          <StatusBadge value={asset.status} options={ASSET_STATUS_OPTIONS} />
        </div>

        <div className="mt-3">
          <Button variant="outline" onClick={() => setReporting(true)} data-testid="passport-report">
            <TriangleAlert className="size-4" aria-hidden />
            {t('quickReport.title')}
          </Button>
          {onChange ? (
            <Button variant="outline" onClick={() => setMoving(true)}>{t('asset.changeLocation')}</Button>
          ) : null}
        </div>

        <dl className="mt-2 grid grid-cols-1 gap-x-6 divide-y sm:grid-cols-2 sm:divide-y-0 keep-cols">
          <Row label={t('common.location')} value={asset.location || property?.name || ''} />
          <Row label={t('module.properties.singular')} value={property?.name ?? ''} />
          <Row label={t('module.buildings.singular')} value={building?.name ?? ''} />
          <Row label={t('module.rooms.singular')} value={room?.name ?? ''} />
          <Row label={t('asset.manufacturer')} value={asset.manufacturer} />
          <Row label={t('asset.model')} value={asset.model} />
          <Row label={t('asset.serial')} value={asset.serialNumber} mono />
          <Row label={t('asset.year')} value={year} />
          <Row label={t('asset.lifecycle')} value={asset.lifecycle ? t(`asset.lifecycle.${asset.lifecycle}` as Parameters<typeof t>[0]) : ''} />
          <Row label={t('asset.criticality')} value={asset.criticality ? t(`priority.${asset.criticality}` as Parameters<typeof t>[0]) : ''} />
          <Row label={t('cost.costCenter')} value={asset.costCenter ?? ''} />
          <Row label={t('asset.parent')} value={asset.parentAssetId ?? ''} mono />
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('asset.conditionRating')}</p>
          <p className="mt-1 text-lg font-semibold">{asset.conditionRating ?? '–'} / 5</p>
          {asset.conditionNote ? <p className="text-sm text-muted-foreground">{asset.conditionNote}</p> : null}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('asset.plannedReplacementYear')}</p>
          <p className="mt-1 text-lg font-semibold">{asset.plannedReplacementYear || '–'}</p>
          <p className="text-sm text-muted-foreground">
            {asset.replacementCost ? formatMoney(asset.replacementCost) : ''}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-medium">{t('asset.locationHistory')}</h3>
        <ul className="mt-2 divide-y text-sm">
          {(asset.locationHistory ?? []).slice().reverse().map((entry) => (
            <li key={entry.id} className="py-2">
              {formatDate(entry.date, settings.language)} · {entry.location || '–'}
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={moving} onOpenChange={setMoving}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('asset.changeLocation')}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <Label>{t('module.buildings.singular')}</Label>
            <Select value={moveBuilding} onValueChange={(value) => { setMoveBuilding(value); setMoveRoom(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{buildings.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent>
            </Select>
            <Label>{t('module.rooms.singular')}</Label>
            <Select value={moveRoom} onValueChange={setMoveRoom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {rooms.filter((entry) => entry.buildingId === moveBuilding).map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>{entry.name || entry.roomNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label>{t('common.location')}</Label>
            <Input value={moveLocation} onChange={(event) => setMoveLocation(event.target.value)} />
          </div>
          <DialogFooter><Button onClick={saveLocation}>{t('action.save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 keep-cols">
        <div className="rounded-xl border bg-card p-4" data-testid="asset-last-maintenance">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('asset.lastMaintenance')}
          </p>
          <p className="mt-1 text-lg font-semibold">
            {last ? formatDate(last, settings.language) : '–'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4" data-testid="asset-next-maintenance">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('asset.nextMaintenance')}
          </p>
          <p className="mt-1 text-lg font-semibold">
            {next ? formatDate(next, settings.language) : '–'}
          </p>
        </div>
      </div>

      <QuickDamageDialog
        open={reporting}
        onOpenChange={setReporting}
        target={{
          title: asset.name || asset.number,
          location: [property?.name, building?.name, room?.name, asset.location]
            .filter(Boolean)
            .join(' · '),
          propertyId: asset.propertyId,
          buildingId: asset.buildingId,
          roomId: asset.roomId,
          assetId: asset.id,
        }}
      />
    </section>
  );
}
