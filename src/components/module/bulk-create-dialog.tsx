'use client';

/**
 * Serienerfassung fuer Kontrollmodule.
 *
 * Statt jeden Raum oder jede Anlage einzeln zu erfassen, wird der Bereich ueber
 * Liegenschaft und Gebaeude eingegrenzt, mehrere Raeume oder Anlagen werden
 * ausgewaehlt ("Alle auswaehlen") und daraus entsteht je Auswahl ein eigener
 * Kontrolldatensatz. Die gemeinsamen Angaben stammen aus dem bestehenden
 * Formular des Moduls, damit alle Felder unveraendert zur Verfuegung stehen.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EntityForm } from '@/components/module/entity-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useCollectionItems } from '@/lib/data/store';
import type { TranslationKey } from '@/lib/i18n/dictionary';
import { useT } from '@/lib/i18n/provider';
import { configOf, titleOfEntity } from '@/lib/module-config';
import { FormValues } from '@/lib/schema';
import { useSettings } from '@/lib/settings/provider';
import { CollectionKey } from '@/lib/types';

/** Module, in denen eine Kontrolle fuer viele Raeume oder Anlagen sinnvoll ist. */
export const BULK_COLLECTIONS: CollectionKey[] = [
  'inspections',
  'firechecks',
  'playgroundchecks',
  'legionella',
  'rcd',
  'cleaningchecks',
  'maintenances',
];

/** Bereiche, fuer die je ein eigener Datensatz entstehen kann. */
export type BulkTarget = 'buildings' | 'rooms' | 'assets';

const MODULE_LABEL: Record<BulkTarget, TranslationKey> = {
  buildings: 'module.buildings',
  rooms: 'module.rooms',
  assets: 'module.assets',
};

export const bulkTargets = (collection: CollectionKey): BulkTarget[] => {
  const names = new Set(configOf(collection).fields.map((field) => field.name));
  const targets: BulkTarget[] = [];
  if (names.has('roomId')) targets.push('rooms');
  if (names.has('assetId')) targets.push('assets');
  if (names.has('buildingId')) targets.push('buildings');
  return targets;
};

export function BulkCreateDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: CollectionKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const config = configOf(collection);
  const { create } = useCollection(collection);
  const { settings } = useSettings();
  const properties = useCollectionItems('properties');
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');
  const assets = useCollectionItems('assets');

  const targets = bulkTargets(collection);
  const [target, setTarget] = useState<BulkTarget>(targets[0] ?? 'rooms');
  const [propertyId, setPropertyId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const scopedBuildings = useMemo(
    () => buildings.filter((building) => !propertyId || building.propertyId === propertyId),
    [buildings, propertyId],
  );

  /** Auswahlliste des gewaehlten Bereichs; ohne Filter alle Eintraege. */
  const candidates = useMemo(() => {
    const buildingIds = new Set(scopedBuildings.map((building) => building.id));
    if (target === 'buildings') {
      return buildingId
        ? scopedBuildings.filter((item) => item.id === buildingId)
        : scopedBuildings;
    }
    if (target === 'rooms') {
      return rooms.filter((room) => {
        if (buildingId) return room.buildingId === buildingId;
        if (propertyId) return buildingIds.has(room.buildingId);
        return true;
      });
    }
    return assets.filter((asset) => {
      if (buildingId) return asset.buildingId === buildingId;
      if (propertyId) return asset.propertyId === propertyId || buildingIds.has(asset.buildingId);
      return true;
    });
  }, [assets, buildingId, propertyId, rooms, scopedBuildings, target]);

  const allSelected = candidates.length > 0 && selected.length === candidates.length;

  const toggleAll = () => setSelected(allSelected ? [] : candidates.map((item) => item.id));

  const toggleOne = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  /** Vorgabewerte des Formulars wie beim einzelnen Anlegen. */
  const initialValues = useMemo(() => {
    const defaults: FormValues = {};
    config.fields.forEach((field) => {
      if (field.kind === 'select') defaults[field.name] = field.options[0]?.value ?? '';
      else if (field.kind === 'address')
        defaults[field.name] = { street: '', zip: '', city: '', country: 'Schweiz' };
      else if (field.kind === 'switch') defaults[field.name] = false;
      else if (field.kind === 'suggest') defaults[field.name] = field.suggestionsOf(defaults)[0] ?? '';
      else defaults[field.name] = '';
    });
    defaults.propertyId = propertyId;
    defaults.buildingId = buildingId;
    return defaults;
  }, [buildingId, config, propertyId]);

  /** Je Datensatz gesetzte Zuordnungen gehoeren nicht ins gemeinsame Formular. */
  const fields = useMemo(() => {
    const hidden =
      target === 'buildings'
        ? ['buildingId', 'roomId', 'assetId']
        : [target === 'rooms' ? 'roomId' : 'assetId'];
    return config.fields.filter((field) => !hidden.includes(field.name));
  }, [config, target]);

  const roomBuilding = (id: string) => rooms.find((room) => room.id === id)?.buildingId ?? '';

  const buildingProperty = (id: string) =>
    buildings.find((building) => building.id === id)?.propertyId ?? '';

  const submit = (values: FormValues) => {
    const chosen = candidates.filter((item) => selected.includes(item.id));
    const author = settings.profileName || settings.companyName;
    chosen.forEach((item) => {
      const place =
        target === 'buildings'
          ? { buildingId: item.id, propertyId: buildingProperty(item.id) || propertyId }
          : target === 'rooms'
            ? { roomId: item.id, buildingId: buildingId || roomBuilding(item.id) }
            : { assetId: item.id };
      const title = String(values.title ?? '').trim();
      create(
        {
          ...values,
          propertyId: values.propertyId || propertyId,
          ...place,
          title: title ? `${title} · ${titleOfEntity(target, item)}` : titleOfEntity(target, item),
        } as never,
        author,
      );
    });
    toast.success(`${t('bulk.created')} (${chosen.length})`);
    setFormOpen(false);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('bulk.title')}</DialogTitle>
            <DialogDescription>{t('bulk.hint')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {targets.length > 1 ? (
              <div className="flex flex-col gap-1">
                <Label>{t('bulk.target')}</Label>
                <Select
                  value={target}
                  onValueChange={(value) => {
                    setTarget(value as BulkTarget);
                    setSelected([]);
                  }}
                >
                  <SelectTrigger data-testid="bulk-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {t(MODULE_LABEL[entry])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              <Label>{t('module.properties.singular')}</Label>
              <Select
                value={propertyId || 'all'}
                onValueChange={(value) => {
                  setPropertyId(value === 'all' ? '' : value);
                  setBuildingId('');
                  setSelected([]);
                }}
              >
                <SelectTrigger data-testid="bulk-property">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {titleOfEntity('properties', property)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={target === 'buildings' ? 'hidden' : 'flex flex-col gap-1'}>
              <Label>{t('module.buildings.singular')}</Label>
              <Select
                value={buildingId || 'all'}
                onValueChange={(value) => {
                  setBuildingId(value === 'all' ? '' : value);
                  setSelected([]);
                }}
              >
                <SelectTrigger data-testid="bulk-building">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {scopedBuildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {titleOfEntity('buildings', building)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAll}
                data-testid="bulk-select-all"
              >
                {allSelected ? t('bulk.clearAll') : t('bulk.selectAll')}
              </Button>
              <span className="text-sm text-muted-foreground" data-testid="bulk-count">
                {selected.length} / {candidates.length}
              </span>
            </div>

            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {candidates.length === 0 ? (
                <li className="p-2 text-sm text-muted-foreground">{t('bulk.empty')}</li>
              ) : (
                candidates.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent/40">
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => toggleOne(item.id)}
                        data-testid="bulk-item"
                      />
                      <span className="truncate">{titleOfEntity(target, item)}</span>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('action.cancel')}
            </Button>
            <Button
              disabled={selected.length === 0}
              onClick={() => setFormOpen(true)}
              data-testid="bulk-next"
            >
              {t('bulk.next')} ({selected.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`${t('bulk.title')} · ${selected.length}`}
        fields={fields}
        initialValues={initialValues}
        onSubmit={submit}
      />
    </>
  );
}
