'use client';

/**
 * Flaechen und Arbeitsplaetze eines Gebaeudes oder einer Liegenschaft.
 *
 * Ausgewertet werden die bereits erfassten Raumflaechen; nichts wird doppelt
 * erfasst. Gezeigt werden Summen, die Verteilung nach Stockwerk und nach
 * Raumart sowie die Raeume ohne Flaechenangabe, damit Luecken auffallen.
 */
import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutGrid, Ruler, Users } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { useCollectionItems } from '@/lib/data/store';
import { useT } from '@/lib/i18n/provider';
import { Building, Room } from '@/lib/types';

interface Bucket {
  key: string;
  label: string;
  rooms: number;
  area: number;
  workplaces: number;
}

const sum = (values: number[]): number =>
  Math.round(values.reduce((total, value) => total + value, 0) * 100) / 100;

const bucketsOf = (
  rooms: Room[],
  labelOf: (room: Room) => { key: string; label: string },
): Bucket[] => {
  const map = new Map<string, Bucket>();
  rooms.forEach((room) => {
    const { key, label } = labelOf(room);
    const bucket = map.get(key) ?? { key, label, rooms: 0, area: 0, workplaces: 0 };
    bucket.rooms += 1;
    bucket.area = Math.round((bucket.area + (room.area ?? 0)) * 100) / 100;
    bucket.workplaces += room.workplaces ?? 0;
    map.set(key, bucket);
  });
  return [...map.values()].sort((a, b) => b.area - a.area);
};

const Metric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
    <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
      <Icon className="size-4" aria-hidden />
    </span>
    <span className="min-w-0">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className="block truncate text-base font-semibold">{value}</span>
    </span>
  </div>
);

const Table = ({ title, buckets }: { title: string; buckets: Bucket[] }) => {
  const t = useT();
  if (buckets.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <ul className="divide-y rounded-xl border bg-card text-sm">
        {buckets.map((bucket) => (
          <li key={bucket.key} className="flex items-center gap-3 p-3">
            <span className="min-w-0 flex-1 truncate font-medium">{bucket.label}</span>
            <span className="text-muted-foreground">
              {bucket.rooms} {t('module.rooms')}
            </span>
            {bucket.workplaces > 0 ? (
              <span className="text-muted-foreground">
                {bucket.workplaces} {t('room.workplaces')}
              </span>
            ) : null}
            <span className="w-24 text-right tabular-nums">{bucket.area} m²</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export function AreaOverview({
  level,
  id,
}: {
  level: 'buildings' | 'properties';
  id: string;
}) {
  const t = useT();
  const buildings = useCollectionItems('buildings');
  const rooms = useCollectionItems('rooms');

  const data = useMemo(() => {
    const scope: Building[] =
      level === 'buildings'
        ? buildings.filter((building) => building.id === id)
        : buildings.filter((building) => building.propertyId === id);
    const ids = scope.map((building) => building.id);
    const own = rooms.filter((room) => ids.includes(room.buildingId));
    const floorName = (room: Room): { key: string; label: string } => {
      const building = scope.find((entry) => entry.id === room.buildingId);
      const floor = building?.floors.find((entry) => entry.id === room.floorId);
      const prefix = level === 'properties' && building ? `${building.name} · ` : '';
      return {
        key: `${room.buildingId}-${room.floorId}`,
        label: `${prefix}${floor ? floor.name : t('area.noFloor')}`,
      };
    };
    return {
      rooms: own,
      buildingArea: sum(scope.map((building) => building.area ?? 0)),
      roomArea: sum(own.map((room) => room.area ?? 0)),
      workplaces: own.reduce((total, room) => total + (room.workplaces ?? 0), 0),
      byFloor: bucketsOf(own, floorName),
      byType: bucketsOf(own, (room) => ({
        key: room.type || 'none',
        label: room.type || t('area.noType'),
      })),
      bySia416: bucketsOf(own, (room) => ({
        key: room.sia416AreaType || 'none',
        label: room.sia416AreaType
          ? t(`area.sia416.${room.sia416AreaType.toLowerCase()}` as Parameters<typeof t>[0])
          : t('area.noType'),
      })),
      missing: own.filter((room) => !room.area),
    };
  }, [buildings, id, level, rooms, t]);

  if (data.rooms.length === 0 && data.buildingArea === 0) {
    return <EmptyState icon={Ruler} titleKey="area.empty" />;
  }

  return (
    <div className="flex flex-col gap-4" data-testid="area-overview">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Ruler}
          label={t('area.building')}
          value={`${data.buildingArea} m²`}
        />
        <Metric icon={LayoutGrid} label={t('area.rooms')} value={`${data.roomArea} m²`} />
        <Metric
          icon={LayoutGrid}
          label={t('module.rooms')}
          value={String(data.rooms.length)}
        />
        <Metric
          icon={Users}
          label={t('room.workplaces')}
          value={String(data.workplaces)}
        />
      </div>

      <Table title={t('area.byFloor')} buckets={data.byFloor} />
      <Table title={t('area.byType')} buckets={data.byType} />
      <Table title={t('area.sia416.type')} buckets={data.bySia416} />

      {data.missing.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted-foreground">
            {t('area.missing')}
          </h3>
          <ul className="divide-y rounded-xl border bg-card">
            {data.missing.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/rooms/${room.id}`}
                  className="flex items-center gap-3 p-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {[room.roomNumber, room.name].filter(Boolean).join(' · ')}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
