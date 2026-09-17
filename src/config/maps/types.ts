import type { TrafficType } from '@/gameplay/LaneDirections';

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
     *  whose `traffic.type` is 'two-way'. */
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
   *  a specific number (see config/maps/index.ts for the validation). */
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
     *  direction too, see `type`). */
    minSpeed: number;
    maxSpeed: number;

    /** "Tipo de Tráfego": the traffic-flow layout this map uses —
     *  'one-way' (every lane runs the same way as the player) or
     *  'two-way' (half the lanes are oncoming). This one setting is the
     *  entire definition of a map's traffic mode; see
     *  gameplay/LaneDirections.ts (buildLaneDirections) for the fixed,
     *  single-source-of-truth rule each option expands into, and for how
     *  NPCs use the result. Every map picks its own independently. */
    type: TrafficType;

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
