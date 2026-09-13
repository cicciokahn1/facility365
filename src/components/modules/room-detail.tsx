'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EntityDetail } from '@/components/module/entity-detail';
import { RelatedList } from '@/components/module/related-list';
import { PlanLocation } from '@/components/modules/plan-location';
import { RecordQr } from '@/components/modules/record-qr';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { Room } from '@/lib/types';
import { newId } from '@/lib/utils/id';

function WorkplaceEditor({ room, update }: { room: Room; update: (values: Partial<Room>) => void }) {
  const t = useT();
  const { items: rooms, update: updateRoom } = useCollection('rooms');
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const workplaces = room.workplaceList ?? [];
  const setWorkplaces = (next: Room['workplaceList']) => update({ workplaceList: next });
  const move = () => {
    const destination = rooms.find((entry) => entry.id === target);
    if (!destination || selected.length === 0) return;
    const moved = workplaces.filter((entry) => selected.includes(entry.id));
    update({ workplaceList: workplaces.filter((entry) => !selected.includes(entry.id)) });
    updateRoom(destination.id, {
      workplaceList: [...(destination.workplaceList ?? []), ...moved],
    }, 'room.workplaceMoved');
    setSelected([]);
    setTarget('');
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{t('room.workplaceList')}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setWorkplaces([
              ...workplaces,
              { id: newId('workplace'), code: '', occupant: '', status: 'free' },
            ])
          }
        >
          <Plus className="size-4" aria-hidden />
          {t('action.add')}
        </Button>
      </div>
      {workplaces.map((workplace) => (
        <div key={workplace.id} className="grid grid-cols-[auto_1fr_1fr_8rem_auto] items-center gap-2">
          <Checkbox
            checked={selected.includes(workplace.id)}
            onCheckedChange={(checked) =>
              setSelected((current) =>
                checked ? [...current, workplace.id] : current.filter((id) => id !== workplace.id),
              )
            }
          />
          <Input
            value={workplace.code}
            placeholder={t('room.workplaceCode')}
            onChange={(event) =>
              setWorkplaces(workplaces.map((entry) =>
                entry.id === workplace.id ? { ...entry, code: event.target.value } : entry,
              ))
            }
          />
          <Input
            value={workplace.occupant}
            placeholder={t('room.occupant')}
            onChange={(event) =>
              setWorkplaces(workplaces.map((entry) =>
                entry.id === workplace.id ? { ...entry, occupant: event.target.value } : entry,
              ))
            }
          />
          <Select
            value={workplace.status}
            onValueChange={(value) =>
              setWorkplaces(workplaces.map((entry) =>
                entry.id === workplace.id ? { ...entry, status: value as typeof entry.status } : entry,
              ))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">{t('room.workplace.free')}</SelectItem>
              <SelectItem value="occupied">{t('room.workplace.occupied')}</SelectItem>
              <SelectItem value="reserved">{t('room.workplace.reserved')}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('action.delete')}
            onClick={() => setWorkplaces(workplaces.filter((entry) => entry.id !== workplace.id))}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      {workplaces.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="min-w-52"><SelectValue placeholder={t('room.moveTarget')} /></SelectTrigger>
            <SelectContent>
              {rooms.filter((entry) => entry.id !== room.id).map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>{entry.name || entry.number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={!target || selected.length === 0} onClick={move}>
            {t('room.move')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function RoomDetail({ id }: { id: string }) {
  return (
    <EntityDetail
      collection="rooms"
      id={id}
      extraTabs={(room, update) => [
        {
          value: 'assets',
          labelKey: 'module.assets',
          content: <RelatedList collection="assets" field="roomId" value={room.id} />,
        },
        {
          value: 'plan',
          labelKey: 'tab.plans',
          content: <PlanLocation roomId={room.id} />,
        },
        {
          value: 'workplaces',
          labelKey: 'room.workplaceList',
          content: <WorkplaceEditor room={room} update={(values) => update(values)} />,
        },
        {
          value: 'qr',
          labelKey: 'tab.qr',
          content: (
            <RecordQr
              path={`/rooms/${room.id}`}
              number={room.number}
              title={[room.roomNumber, room.name].filter(Boolean).join(' · ')}
            />
          ),
        },
      ]}
    />
  );
}
