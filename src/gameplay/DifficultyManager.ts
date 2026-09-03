import { DIFFICULTY_CURVE } from '@/config/constants';
import { clamp, lerp } from '@/utils/MathUtils';
import type { MapConfig } from '@/config/maps';

/**
 * Converts elapsed run time into "how hard is the game right now" — the
 * target cruise speed the player accelerates towards, and how fast traffic
 * spawns. A map's `difficultyMultiplier` scales the time axis, so a harder
 * map ramps up faster without any change here.
 */
export class DifficultyManager {
  private elapsed = 0;

  constructor(private map: MapConfig) {}

  update(dt: number): void {
    this.elapsed += dt * this.map.difficultyMultiplier;
  }

  private progress(): number {
    return clamp(this.elapsed / DIFFICULTY_CURVE.secondsToMaxSpeed, 0, 1);
  }

  getTargetSpeed(vehicleMaxSpeed: number): number {
    const ratio = lerp(DIFFICULTY_CURVE.startSpeedRatio, 1, this.progress());
    return vehicleMaxSpeed * ratio;
  }

  /** Multiplies a map's base traffic spawn interval; shrinks toward
   *  `trafficIntervalFactorAtMax` as the run progresses. */
  getTrafficIntervalFactor(): number {
    return lerp(1, DIFFICULTY_CURVE.trafficIntervalFactorAtMax, this.progress());
  }

  get speedRatio(): number {
    return lerp(DIFFICULTY_CURVE.startSpeedRatio, 1, this.progress());
  }
}
