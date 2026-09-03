import { WORLD } from '@/config/constants';
import type { PlayerState, TrafficInstance } from './types';

/** Small safety margin so collisions feel fair (placeholder boxes touching
 *  exactly at their edges shouldn't already read as a crash). */
const COLLISION_FORGIVENESS = 0.82;

/**
 * Lane-based collision: same lane + overlapping z-range near the player.
 * Deliberately simple (no full 3D physics) since vehicles are always
 * lane-aligned by construction — this is enough to be fair and readable.
 */
export class CollisionSystem {
  check(player: PlayerState, playerHalfLength: number, traffic: TrafficInstance[]): boolean {
    for (const instance of traffic) {
      if (instance.laneIndex !== player.laneIndex) continue;
      const distanceZ = Math.abs(instance.group.position.z - WORLD.playerZ);
      const combinedHalfLength = (playerHalfLength + instance.halfLength) * COLLISION_FORGIVENESS;
      if (distanceZ < combinedHalfLength) return true;
    }
    return false;
  }
}
