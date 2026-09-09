import { WORLD } from '@/config/constants';
import type { PlayerState, TrafficInstance } from './types';

/** Small safety margin so collisions feel fair (placeholder boxes touching
 *  exactly at their edges shouldn't already read as a crash). */
const COLLISION_FORGIVENESS = 0.82;

/**
 * True AABB overlap in both X and Z — the player's lateral position is now
 * free/continuous (see PlayerVehicle), so "same lane" no longer means
 * anything for collision purposes. A traffic instance's actual world X
 * position is what's checked, regardless of which lane slot it spawned in.
 */
export class CollisionSystem {
  check(player: PlayerState, playerHalfWidth: number, playerHalfLength: number, traffic: TrafficInstance[]): boolean {
    for (const instance of traffic) {
      const distanceZ = Math.abs(instance.group.position.z - WORLD.playerZ);
      const combinedHalfLength = (playerHalfLength + instance.halfLength) * COLLISION_FORGIVENESS;
      if (distanceZ >= combinedHalfLength) continue;

      const distanceX = Math.abs(instance.group.position.x - player.currentX);
      const combinedHalfWidth = (playerHalfWidth + instance.halfWidth) * COLLISION_FORGIVENESS;
      if (distanceX >= combinedHalfWidth) continue;

      return true;
    }
    return false;
  }
}
