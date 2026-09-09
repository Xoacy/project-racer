import type { TrafficDirection } from '@/gameplay/LaneDirections';

/**
 * Data-driven map/track definition. Adding a new map means adding one file
 * satisfying this shape and registering it in `config/maps/index.ts` — the
 * Track/Scenery/Traffic systems read everything from here, nothing about a
 * specific map is hardcoded into gameplay logic.
 */
export interface MapConfig {
  id: string;
  name: string;

  theme: {
    roadColor: number;
    laneLineColor: number;
    /** Divider between two lanes carrying opposite traffic directions —
     *  rendered as a solid double line instead of a dashed one. Present
     *  on every map for type-uniformity, but only ever drawn on a map
     *  whose `traffic.laneDirections` actually contains a direction
     *  change (a two-way map). */
    centerDividerColor: number;
    shoulderColor: number;
    groundColor: number;
    skyColor: number;
    fogColor: number;
    fogNear: number;
    fogFar: number;
  };

  /** Every map has exactly 4 lanes (a fixed rule of the game, not just a
   *  default) — `count` stays an explicit field rather than a hardcoded
   *  "4" sprinkled through the code so the rest of the game never assumes
   *  a specific number, and so `traffic.laneDirections` has something to
   *  be validated against (see config/maps/index.ts). */
  lanes: {
    count: number;
    width: number; // meters
  };

  /** Length in meters of one recyclable road segment/chunk. */
  segmentLength: number;
  /** How many segments stay alive ahead of + behind the player at once. */
  activeSegments: number;

  scenery: {
    /** Average meters between scenery spawn attempts, per side of the road. */
    spawnInterval: number;
    /** Placeholder-only prop palette; real prop types come from Blender later. */
    propColors: number[];
  };

  traffic: {
    /** Base meters between traffic spawn attempts at the start of a run. */
    baseSpawnInterval: number;
    /** Traffic vehicles' forward speed range, in m/s (their own cruise
     *  pace — how fast they actually close in on the player depends on
     *  direction too, see `laneDirections`). */
    minSpeed: number;
    maxSpeed: number;

    /** One entry per lane (must have exactly `lanes.count` entries, left
     *  to right): 1 = same direction as the player, -1 = oncoming. All
     *  1s is "mode 1" (4 lanes, one direction); e.g. [1,1,-1,-1] is
     *  "mode 2" (two-way, lanes 0-1 the player's way, 2-3 oncoming). This
     *  one array is the entire definition of a map's traffic mode — see
     *  gameplay/LaneDirections.ts for how NPCs use it. */
    laneDirections: readonly TrafficDirection[];

    /** Chance [0,1] that an NPC's periodic lane-change check actually
     *  results in an attempt — randomized per-NPC between these bounds
     *  so traffic doesn't all decide to change lanes in lockstep. */
    laneChangeChance: { min: number; max: number };
    /** Seconds of following distance an NPC tries to keep behind the
     *  vehicle ahead of it in its own lane group, at its current speed
     *  (this map's "safety distance" knob — see NPC_TUNING.idm for the
     *  rest of the car-following model, which isn't map-specific). */
    safeFollowSeconds: number;
  };

  /** Multiplier applied to the global difficulty curve — lets a map be
   *  globally harder/easier without touching DifficultyManager. */
  difficultyMultiplier: number;
}
