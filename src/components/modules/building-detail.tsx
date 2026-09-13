'use client';

import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { AreaOverview } from '@/components/modules/area-overview';
import { FloorEditor } from '@/components/modules/floor-editor';
import { PlanManager } from '@/components/modules/plan-manager';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { parseIfcStructure, exportBuildingIfc } from '@/lib/integrations/ifc';
import { newId } from '@/lib/utils/id';
import { Room } from '@/lib/types';

function IfcTools({ building, update }: { building: Parameters<typeof exportBuildingIfc>[0]; update: (values: Partial<typeof building>) => void }) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const { items: rooms, create } = useCollection('rooms');
  const { items: assets } = useCollection('assets');
  const exportFile = () => {
    const text = exportBuildingIfc(building, building.floors, rooms, assets);
    const url = URL.createObjectURL(new Blob([text], { type: 'application/ifc' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${building.name || 'building'}.ifc`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importFile = async (file: File) => {
    const parsed = parseIfcStructure(await file.text());
    const knownFloors = new Map(building.floors.map((floor) => [floor.name.toLowerCase(), floor]));
    const floors = [...building.floors];
    let floorsAdded = 0;
    let roomsAdded = 0;
    parsed.storeys.forEach((storey, index) => {
      let floor = knownFloors.get(storey.name.toLowerCase());
      if (!floor) {
        floor = { id: newId('floor'), name: storey.name, level: storey.elevation ?? index, note: '' };
        floors.push(floor);
        knownFloors.set(storey.name.toLowerCase(), floor);
        floorsAdded += 1;
      }
      storey.spaces.forEach((space) => {
        if (rooms.some((room) => room.buildingId === building.id && room.floorId === floor?.id && room.name === space.name)) return;
        create({
          name: space.name,
          roomNumber: space.longName,
          buildingId: building.id,
          floorId: floor.id,
          type: '',
          status: 'active',
          description: '',
        } as Partial<Room>);
        roomsAdded += 1;
      });
    });
    update({ floors });
    toast.success(`${t('building.ifcImported')}: ${floorsAdded} ${t('floor.floors')}, ${roomsAdded} ${t('module.rooms')}`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={exportFile}><Download className="size-4" aria-hidden />{t('building.ifcExport')}</Button>
      <Button variant="outline" onClick={() => input.current?.click()}><Upload className="size-4" aria-hidden />{t('building.ifcImport')}</Button>
      <input ref={input} type="file" accept=".ifc" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void importFile(file);
        event.target.value = '';
      }} />
    </div>
  );
}

export function BuildingDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="buildings"
      id={id}
      extraTabs={(building, update) => [
        {
          value: 'ifc',
          labelKey: 'building.ifc',
          content: <IfcTools building={building} update={update} />,
        },
        {
          value: 'floors',
          labelKey: 'tab.floors',
          content: <FloorEditor floors={building.floors} onChange={(floors) => update({ floors })} />,
        },
        {
          value: 'rooms',
          labelKey: 'module.rooms',
          content: <RelatedList collection="rooms" field="buildingId" value={building.id} />,
        },
        {
          value: 'areas',
          labelKey: 'tab.areas',
          content: <AreaOverview level="buildings" id={building.id} />,
        },
        {
          value: 'plans',
          labelKey: 'tab.plans',
          content: (
            <PlanManager
              plans={building.plans}
              floors={building.floors}
              onChange={(plans) => update({ plans })}
            />
          ),
        },
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="buildingId" value={building.id} />,
        },
      ]}
    />
  );
}
