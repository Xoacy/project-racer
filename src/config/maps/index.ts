import type { MapConfig } from './types';
import { highwayDusk } from './highwayDusk';
import { desertNoon } from './desertNoon';

export type { MapConfig } from './types';

/** Registry: single source of truth for the map-select screen. */
export const MAPS: MapConfig[] = [highwayDusk, desertNoon];

export type MapId = (typeof MAPS)[number]['id'];

export function getMapById(id: string): MapConfig {
  const found = MAPS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown map id: ${id}`);
  return found;
}
