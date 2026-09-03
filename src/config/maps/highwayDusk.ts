import type { MapConfig } from './types';

export const highwayDusk: MapConfig = {
  id: 'highway_dusk',
  name: 'Highway Dusk',
  theme: {
    roadColor: 0x2b2b33,
    laneLineColor: 0xf1faee,
    shoulderColor: 0x3a3a42,
    groundColor: 0x264653,
    skyColor: 0xf4a261,
    fogColor: 0xf4a261,
    fogNear: 60,
    fogFar: 180,
  },
  lanes: { count: 3, width: 3.2 },
  segmentLength: 40,
  activeSegments: 8,
  scenery: {
    spawnInterval: 14,
    propColors: [0x2a9d8f, 0x264653, 0xe9c46a],
  },
  traffic: {
    baseSpawnInterval: 55,
    minSpeed: 10,
    maxSpeed: 24,
  },
  difficultyMultiplier: 1,
};
