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
  if (map.traffic.laneDirections.length !== map.lanes.count) {
    throw new Error(
      `Map "${map.id}"'s traffic.laneDirections has ${map.traffic.laneDirections.length} entries, expected ${map.lanes.count} (one per lane).`
    );
  }
}

export type MapId = (typeof MAPS)[number]['id'];

export function getMapById(id: string): MapConfig {
  const found = MAPS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown map id: ${id}`);
  return found;
}
