import type { VehicleConfig } from './types';
import { sedanHero } from './sedanHero';
import { muscleBrute } from './muscleBrute';

export type { VehicleConfig } from './types';

/** Registry: this array is the single source of truth for what appears in
 *  the vehicle-select screen. Add a vehicle file, import it, push it here. */
export const VEHICLES: VehicleConfig[] = [sedanHero, muscleBrute];

export type VehicleId = (typeof VEHICLES)[number]['id'];

export function getVehicleById(id: string): VehicleConfig {
  const found = VEHICLES.find((v) => v.id === id);
  if (!found) throw new Error(`Unknown vehicle id: ${id}`);
  return found;
}
