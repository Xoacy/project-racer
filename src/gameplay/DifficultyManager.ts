import { DIFFICULTY_CURVE } from '@/config/constants';
import { clamp, lerp } from '@/utils/MathUtils';
import type { MapConfig } from '@/config/maps';

/**
 * Converts elapsed run time into traffic pressure: how hard the game is
 * right now, and how often traffic spawns. A map's `difficultyMultiplier`
 * scales the time axis.
 */
export class DifficultyManager {
  private elapsed = 0;

  constructor(private map: MapConfig) {}

  update(dt: number): void {
    this.elapsed += dt * this.map.difficultyMultiplier;
  }

  private progress(): number {
    return clamp(this.elapsed / DIFFICULTY_CURVE.rampSeconds, 0, 1);
  }

  /** Multiplies a map's base traffic spawn interval; shrinks toward
   *  `trafficIntervalFactorAtMax` as the run progresses. */
  getTrafficIntervalFactor(): number {
    return lerp(1, DIFFICULTY_CURVE.trafficIntervalFactorAtMax, this.progress());
  }
}
