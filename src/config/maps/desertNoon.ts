import type { MapConfig } from './types';

/** Tipo de Tráfego: mão dupla — the two rightmost lanes (2-3) run with the
 *  player, the two leftmost (0-1) are the oncoming contraflow (see
 *  gameplay/LaneDirections.ts's buildLaneDirections for the fixed
 *  left-half/right-half rule). See highwayDusk.ts for the mão única
 *  counterpart; both use the exact same gameplay code, only `traffic.type`
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
    skyTexturePath: 'textures/sky.jpg',
    // This HDRI's sun sits at azimuth 36°/elevation 29°; yaw swings it
    // around to straight ahead, pitch tilts it down into the narrow band
    // of sky the chase camera actually shows.
    skyRotationDeg: { yaw: 96, pitch: -24 },
    // Matches the sun's on-screen side (upper right, ahead of the car) so
    // shadows fall left and back toward the camera. Height is cheated up
    // from the sun's apparent ~6° elevation to keep shadows short enough
    // to stay inside the shadow map.
    sunLightPosition: { x: 6, y: 14, z: -13 },
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
    type: 'two-way',
    // A bit more cautious than the one-way map: closing speed with
    // oncoming traffic is much higher (see NpcDriver's direction-aware
    // scroll math), so NPCs give themselves more room before committing
    // to a lane change.
    laneChangeChance: { min: 0.1, max: 0.35 },
    safeFollowSeconds: 1.2,
  },
  difficultyMultiplier: 1.15,
};
