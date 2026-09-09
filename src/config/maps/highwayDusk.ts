import type { MapConfig } from './types';

/** Traffic mode 1: all 4 lanes run the same direction as the player —
 *  see desertNoon.ts for the two-way counterpart. Both use the exact same
 *  gameplay code; only `traffic.laneDirections` differs. */
export const highwayDusk: MapConfig = {
  id: 'highway_dusk',
  name: 'Highway Dusk',
  theme: {
    roadColor: 0x2b2b33,
    laneLineColor: 0xf1faee,
    centerDividerColor: 0xe9c46a,
    shoulderColor: 0x3a3a42,
    groundColor: 0x264653,
    skyColor: 0xf4a261,
    fogColor: 0xf4a261,
    fogNear: 60,
    fogFar: 180,
  },
  lanes: { count: 4, width: 3.2 },
  segmentLength: 40,
  activeSegments: 8,
  scenery: {
    spawnInterval: 14,
    propColors: [0x2a9d8f, 0x264653, 0xe9c46a],
  },
  traffic: {
    baseSpawnInterval: 40,
    minSpeed: 10,
    maxSpeed: 24,
    laneDirections: [1, 1, 1, 1],
    laneChangeChance: { min: 0.15, max: 0.5 },
    safeFollowSeconds: 1,
  },
  difficultyMultiplier: 1,
};
