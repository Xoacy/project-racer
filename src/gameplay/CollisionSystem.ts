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
    const cos = Math.cos(player.yaw);
    const sin = Math.sin(player.yaw);
    for (const { driver } of traffic) {
      const dx = driver.x - player.currentX;
      const dz = driver.z - WORLD.playerZ;
      const localX = dx * cos + dz * sin;
      const localZ = dx * sin - dz * cos;

      const combinedHalfLength = (playerHalfLength + driver.halfLength) * COLLISION_FORGIVENESS;
      if (Math.abs(localZ) >= combinedHalfLength) continue;

      const combinedHalfWidth = (playerHalfWidth + driver.halfWidth) * COLLISION_FORGIVENESS;
      if (Math.abs(localX) >= combinedHalfWidth) continue;

      return true;
    }
    return false;
  }
}
