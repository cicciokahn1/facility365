import { Asset, Building, BuildingFloor, Room } from '@/lib/types';

const quote = (value: string): string => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const guid = (prefix: string, index: number): string => `${prefix}${index.toString(36).padStart(20, '0')}`.slice(0, 22);

export function exportBuildingIfc(
  building: Building,
  floors: BuildingFloor[],
  rooms: Room[],
  assets: Asset[],
): string {
  let next = 1;
  const project = next++;
  const site = next++;
  const buildingId = next++;
  const owner = next++;
  const storeyIds = new Map<string, number>();
  const spaceIds = new Map<string, number>();
  const proxyIds = new Map<string, number>();
  floors.forEach((floor) => storeyIds.set(floor.id, next++));
  rooms.filter((room) => room.buildingId === building.id).forEach((room) => spaceIds.set(room.id, next++));
  assets.filter((asset) => asset.buildingId === building.id).forEach((asset) => proxyIds.set(asset.id, next++));

  const lines = [
    `#${owner}=IFCOWNERHISTORY($,$,$,.ADDED.,$,$,$,0);`,
    `#${project}=IFCPROJECT('${guid('project', project)}',#${owner},${quote(building.name || 'Facility365')},$,$,$,$,$);`,
    `#${site}=IFCSITE('${guid('site', site)}',#${owner},${quote(building.name || 'Site')},$,$,$,$,$,$,$,$,$,$);`,
    `#${buildingId}=IFCBUILDING('${guid('building', buildingId)}',#${owner},${quote(building.name || 'Building')},$,$,$,$,$,$);`,
  ];
  storeyIds.forEach((id, floorId) => {
    const floor = floors.find((entry) => entry.id === floorId);
    lines.push(`#${id}=IFCBUILDINGSTOREY('${guid('storey', id)}',#${owner},${quote(floor?.name || 'Storey')},$,$,$,$,${floor?.level ?? 0});`);
  });
  spaceIds.forEach((id, roomId) => {
    const room = rooms.find((entry) => entry.id === roomId);
    lines.push(`#${id}=IFCSPACE('${guid('space', id)}',#${owner},${quote(room?.name || 'Space')},${quote(room?.name || room?.roomNumber || 'Space')},$,$,$,$,.ELEMENT.,$);`);
  });
  proxyIds.forEach((id, assetId) => {
    const asset = assets.find((entry) => entry.id === assetId);
    lines.push(`#${id}=IFCBUILDINGELEMENTPROXY('${guid('asset', id)}',#${owner},${quote(asset?.name || 'Asset')},$,$,$,$,$);`);
  });
  const relation = (parent: number, children: number[], index: number) =>
    children.length
      ? `#${next++}=IFCRELAGGREGATES('${guid('aggregate', index)}',#${owner},$,$,#${parent},(${children.map((id) => `#${id}`).join(',')}));`
      : '';
  lines.push(relation(project, [site], 1), relation(site, [buildingId], 2));
  lines.push(relation(buildingId, [...storeyIds.values()], 3));
  let relationIndex = 4;
  storeyIds.forEach((storeyId, floorId) => {
    const children = rooms.filter((room) => room.floorId === floorId).map((room) => spaceIds.get(room.id)).filter((id): id is number => id !== undefined);
    lines.push(relation(storeyId, children, relationIndex++));
  });
  storeyIds.forEach((storeyId, floorId) => {
    const contained = assets.filter((asset) => asset.buildingId === building.id && rooms.some((room) => room.id === asset.roomId && room.floorId === floorId))
      .map((asset) => proxyIds.get(asset.id)).filter((id): id is number => id !== undefined);
    if (contained.length) lines.push(`#${next++}=IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid('contain', relationIndex++)}',#${owner},$,$,(${contained.map((id) => `#${id}`).join(',')}),#${storeyId});`);
  });
  if (spaceIds.size) {
    lines.push(
      `#${next++}=IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid('contain', relationIndex)}',#${owner},$,$,(${[...spaceIds.values()].map((id) => `#${id}`).join(',')}),#${buildingId});`,
    );
  }
  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('Facility365 IFC4 Export'),'2;1');",
    "FILE_NAME('facility365.ifc','2024-01-01T00:00:00',('Facility365'),('Facility365'),'Facility365','Facility365','');",
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
    lines.filter(Boolean).join('\n'),
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n');
}

export function parseIfcStructure(text: string): {
  storeys: { name: string; elevation?: number; spaces: { name: string; longName: string }[] }[];
} {
  const storeys = new Map<string, { name: string; elevation?: number; spaces: { name: string; longName: string }[] }>();
  const spaces = new Map<string, { name: string; longName: string }>();
  text.split(/\r?\n/).forEach((line) => {
    const storey = line.match(/#(\d+)=IFCBUILDINGSTOREY\([^,]*,[^,]*,('(?:[^']|'')*').*?,(-?\d+(?:\.\d+)?)\);/i);
    if (storey) storeys.set(`#${storey[1]}`, { name: storey[2].slice(1, -1).replace(/''/g, "'"), elevation: Number(storey[3]), spaces: [] });
    const space = line.match(/#(\d+)=IFCSPACE\([^,]*,[^,]*,('(?:[^']|'')*'),('(?:[^']|'')*')/i);
    if (space) spaces.set(`#${space[1]}`, {
      name: space[2].slice(1, -1).replace(/''/g, "'"),
      longName: space[3].slice(1, -1).replace(/''/g, "'"),
    });
  });
  const contained = /IFCRELCONTAINEDINSPATIALSTRUCTURE\([^,]*,[^,]*,[^,]*,[^,]*,\(([^)]*)\),#(\d+)\)/i;
  const aggregates = /IFCRELAGGREGATES\([^,]*,[^,]*,[^,]*,[^,]*,#(\d+),\(([^)]*)\)\)/i;
  text.split(/\r?\n/).forEach((line) => {
    const match = line.match(contained);
    if (match) {
      const target = storeys.get(`#${match[2]}`);
      match[1].match(/#\d+/g)?.forEach((id) => {
        const space = spaces.get(id);
        if (target && space) target.spaces.push(space);
      });
    }
    const aggregate = line.match(aggregates);
    if (aggregate) {
      const target = storeys.get(`#${aggregate[1]}`);
      aggregate[2].match(/#\d+/g)?.forEach((id) => {
        const space = spaces.get(id);
        if (target && space) target.spaces.push(space);
      });
    }
  });
  return { storeys: [...storeys.values()] };
}
