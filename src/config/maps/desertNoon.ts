import type { MapConfig } from './types';

/** Traffic mode 2: lanes 0-1 run with the player, lanes 2-3 are the
 *  oncoming contraflow — see highwayDusk.ts for the one-way counterpart.
 *  Both use the exact same gameplay code; only `traffic.laneDirections`
 *  (and the slightly more cautious safety numbers below) differs. */
export const desertNoon: MapConfig = {
  id: 'desert_noon',
  name: 'Desert Noon',
  theme: {
    roadColor: 0x4a4238,
    laneLineColor: 0xffffff,
    centerDividerColor: 0xffd60a,
    shoulderColor: 0x6b5b45,
    groundColor: 0xd8a75c,
    skyColor: 0xa8dadc,
    fogColor: 0xdcc48e,
    fogNear: 70,
    fogFar: 210,
  },
  lanes: { count: 4, width: 3.0 },
  segmentLength: 40,
  activeSegments: 8,
  scenery: {
    spawnInterval: 11,
    propColors: [0x9c6644, 0x6b705c, 0xcb997e],
  },
  traffic: {
    baseSpawnInterval: 42,
    minSpeed: 12,
    maxSpeed: 27,
    laneDirections: [1, 1, -1, -1],
    // A bit more cautious than the one-way map: closing speed with
    // oncoming traffic is much higher (see NpcDriver's direction-aware
    // scroll math), so NPCs give themselves more room before committing
    // to a lane change.
    laneChangeChance: { min: 0.1, max: 0.35 },
    safeFollowSeconds: 1.2,
  },
  difficultyMultiplier: 1.15,
};
