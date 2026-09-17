import type { MapConfig } from './types';
import { highwayDusk } from './highwayDusk';
import { desertNoon } from './desertNoon';

export type { MapConfig } from './types';

/** Registry: single source of truth for the map-select screen. */
export const MAPS: MapConfig[] = [highwayDusk, desertNoon];

for (const map of MAPS) {
  if (map.lanes.count !== 4) {
    throw new Error(`Map "${map.id}" has ${map.lanes.count} lanes — every map must have exactly 4.`);
  }
  if (map.traffic.type === 'two-way' && map.lanes.count % 2 !== 0) {
    throw new Error(`Map "${map.id}" is two-way but has an odd lane count (${map.lanes.count}) — can't split evenly.`);
  }
}

export type MapId = (typeof MAPS)[number]['id'];

export function getMapById(id: string): MapConfig {
  const found = MAPS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown map id: ${id}`);
  return found;
}
