import type { MapConfig } from './types';

/** Second map, purely to prove maps are data-driven: different lane count,
 *  palette and difficulty scaling, zero new gameplay code required. */
export const desertNoon: MapConfig = {
  id: 'desert_noon',
  name: 'Desert Noon',
  theme: {
    roadColor: 0x4a4238,
    laneLineColor: 0xffffff,
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
    baseSpawnInterval: 48,
    minSpeed: 12,
    maxSpeed: 27,
  },
  difficultyMultiplier: 1.15,
};
