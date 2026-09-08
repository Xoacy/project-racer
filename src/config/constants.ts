/**
 * All "tune by feel" numbers live here, grouped by system, so nothing is
 * hardcoded in the middle of gameplay/render logic. Change values here,
 * not where they're used.
 */

/** Purely cosmetic vehicle-view animation — NOT physics. Drives the
 *  roll/pitch/bob procedural juice described in the design brief. */
export const JUICE_TUNING = {
  /** Roll (bank) applied while changing lanes. */
  roll: {
    maxAngleRad: 0.16,
    /** Radians of roll per (m/s) of lateral velocity, before clamping to maxAngleRad. */
    radiansPerLateralSpeed: 0.045,
    /** Exponential-smoothing rate (1/seconds) for how fast roll eases in/out. */
    lerpRate: 7,
  },
  /** Pitch (nose up/down) applied under acceleration/braking. */
  pitch: {
    maxAngleRad: 0.09,
    /** Radians of pitch per (m/s^2) of forward acceleration, before clamping. */
    radiansPerAcceleration: 0.012,
    lerpRate: 6,
  },
  /** Continuous idle suspension bob, sine-driven. */
  bob: {
    amplitudeMeters: 0.035,
    frequencyHz: 2.2,
    /** How much forward speed (ratio 0..1 of vehicle max speed) adds to bob amplitude. */
    speedAmplitudeBoost: 0.6,
  },
  /** Camera shake / FOV kick placeholders — cheap wins to try once the feel
   *  is validated; wired but subtle by default. */
  camera: {
    fovBase: 62,
    fovMaxBoost: 8, // added at max speed ratio
    fovLerpRate: 3,
    followLerpRate: 5,
  },
};

/** Lane-change and player-controller tuning not specific to one vehicle. */
export const PLAYER_TUNING = {
  /** While a direction is held (keyboard held down, HUD button held), this
   *  is the interval (s) between auto-repeated lane-change steps — lets
   *  the player cross several lanes in one continuous hold instead of one
   *  discrete press per lane. The first step on press-down always fires
   *  immediately regardless of this cooldown. */
  laneChangeInputCooldown: 0.12,
};

/** Global difficulty ramp — how fast the "target speed" a run pushes the
 *  player towards climbs over time, and how traffic density scales with it.
 *  A map's `difficultyMultiplier` scales the time axis of this curve. */
export const DIFFICULTY_CURVE = {
  /** Seconds of a run before target speed reaches the vehicle's maxSpeed. */
  secondsToMaxSpeed: 90,
  /** Fraction of maxSpeed the run starts at. */
  startSpeedRatio: 0.45,
  /** Traffic spawn interval shrinks by this factor at full difficulty
   *  (e.g. 0.5 = spawns twice as often once fully ramped up). */
  trafficIntervalFactorAtMax: 0.55,
};

/** Scoring. */
export const SCORE_TUNING = {
  pointsPerMeter: 1,
};

/** World layout constants that are not per-map (per-map values live in
 *  MapConfig). */
export const WORLD = {
  /** z-distance behind the camera at which scrolled objects get recycled. */
  cullDistanceBehind: 12,
  /** Player car's fixed z position (world scrolls under/around it). */
  playerZ: 0,
};
