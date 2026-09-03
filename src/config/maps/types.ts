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
    shoulderColor: number;
    groundColor: number;
    skyColor: number;
    fogColor: number;
    fogNear: number;
    fogFar: number;
  };

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
    /** Traffic vehicles' forward speed range, in m/s. */
    minSpeed: number;
    maxSpeed: number;
  };

  /** Multiplier applied to the global difficulty curve — lets a map be
   *  globally harder/easier without touching DifficultyManager. */
  difficultyMultiplier: number;
}
