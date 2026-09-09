/**
 * All "tune by feel" numbers live here, grouped by system, so nothing is
 * hardcoded in the middle of gameplay/render logic. Change values here,
 * not where they're used.
 */

/** Purely cosmetic vehicle-view animation — NOT physics. Drives the
 *  roll/pitch/bob procedural juice described in the design brief. */
export const JUICE_TUNING = {
  /** Roll (bank) applied while steering laterally. */
  roll: {
    maxAngleRad: 0.16,
    /** Radians of roll per (m/s) of lateral velocity, before clamping to
     *  maxAngleRad — tuned so max roll lands near a typical vehicle's
     *  lateralMaxSpeed (see VehicleConfig.physics), not far below it, so
     *  gentle nudges and full-deflection steering visibly feel different. */
    radiansPerLateralSpeed: 0.02,
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

/** AI traffic (NPC) tuning that stays the same across every map — the
 *  map-specific knobs (traffic speed, lane-change chance, safe following
 *  time) live in MapConfig.traffic instead, since those are meant to vary
 *  per map/mode. See gameplay/NpcDriver.ts for how these are used. */
export const NPC_TUNING = {
  /** Intelligent Driver Model params (Treiber et al., 2000) — a compact
   *  car-following formula: an NPC accelerates toward its own cruise
   *  speed on an open road, and smoothly brakes to keep a safe,
   *  speed-dependent gap behind whichever vehicle is directly ahead of it
   *  in its lateral path. Composes correctly across a chain of several
   *  vehicles with no special-casing. `timeHeadway` (the map-specific
   *  "safety distance" knob) is passed in per-NPC from
   *  MapConfig.traffic.safeFollowSeconds instead of living here. */
  idm: {
    maxAcceleration: 2.2, // m/s^2
    comfortableDeceleration: 3.5, // m/s^2 (positive value)
    minGap: 3.5, // meters, desired bumper-to-bumper gap at a dead stop
    accelerationExponent: 4,
  },
  /** Beyond this lateral distance (plus both half-widths), two vehicles
   *  are considered to be in different paths entirely — not relevant to
   *  each other for following or lane-change safety checks. */
  lateralFollowMargin: 0.5,
  /** Lateral movement while executing a lane change. */
  lateral: {
    maxSpeed: 3.2, // m/s
    acceleration: 6, // m/s^2
    deceleration: 8, // m/s^2
    /** How much of the remaining distance to the target lane the NPC
     *  tries to close per second — shapes an "ease into it" lane change
     *  that settles cleanly instead of overshooting and correcting. */
    approachGain: 2.5,
    /** Within this distance of the target lane, the NPC is considered
     *  settled and may consider a new lane-change decision. */
    settledThreshold: 0.05,
  },
  laneChange: {
    /** Random interval (s) between lane-change decision checks. */
    checkIntervalMin: 4,
    checkIntervalMax: 11,
    /** Minimum bumper-to-bumper gap required in the target lane, ahead
     *  and behind, to commit to a lane change — behind gets a bit more
     *  room so an NPC never cuts someone off closely from the side. */
    minGapAhead: 6,
    minGapBehind: 8,
  },
};

/** World layout constants that are not per-map (per-map values live in
 *  MapConfig). */
export const WORLD = {
  /** z-distance behind the camera at which scrolled objects get recycled. */
  cullDistanceBehind: 12,
  /** Player car's fixed z position (world scrolls under/around it). */
  playerZ: 0,
  /** When lateral movement is clamped at the road's edge, the car's
   *  incoming lateral speed is inverted and scaled by this factor instead
   *  of just being zeroed — a small "thud and settle back" rebound so
   *  hitting the edge reads as a physical stop, not a hard wall snap. */
  edgeBounceFactor: 0.2,
};
