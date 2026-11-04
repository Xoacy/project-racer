/**
 * All "tune by feel" numbers live here, grouped by system, so nothing is
 * hardcoded in the middle of gameplay/render logic. Change values here,
 * not where they're used.
 */

/** Presentation-only camera effects. Body roll/pitch now come from the
 *  suspension simulation, not from here. */
export const JUICE_TUNING = {
  camera: {
    fovBase: 62,
    fovMaxBoost: 14, // added at max speed ratio
    fovLerpRate: 3,
    followLerpRate: 5,
    speedPullback: 0.9,
    shakeAmplitude: 0.035,
    shakeFrequency: 34,
  },
};

/** Full vehicle simulation tuning: derived mass/geometry plus tire,
 *  powertrain, brake, aero, suspension and assist parameters. Per-vehicle
 *  values still come from VehicleConfig (dimensions, maxSpeed,
 *  acceleration/deceleration, lateralAcceleration, drivetrain). */
export const VEHICLE_SIM_TUNING = {
  massPerVolume: 120,
  frontWeightBias: 0.5,
  wheelbaseLengthRatio: 0.58,
  trackWidthRatio: 0.82,
  cgHeightRatio: 0.33,
  wheelRadiusHeightRatio: 0.22,
  wheelInertia: 2,
  drivenWheelInertia: 12,
  steer: {
    maxAngleRad: 0.3,
    rate: 3.5,
    returnRate: 5.0,
    highSpeedLoss: 0.85,
  },
  tire: {
    peakSlipRatio: 0.12,
    peakSlipAngleRad: 0.14,
    loadSensitivity: 0.1,
    gripScale: 0.5,
    minMu: 0.7,
    maxMu: 2.2,
    frontGripFactor: 1,
    rearGripFactor: 1,
    relaxationLength: 0.6,
  },
  engine: {
    idleRpm: 900,
    redlineRpm: 6500,
    gearRatios: [3.4, 2.2, 1.6, 1.25, 1.0, 0.82],
    efficiency: 0.9,
    accelerationMultiplier: 1.7,
    torqueCurveFloor: 0.35,
    engineBrakeFactor: 0.06,
    shiftUpRatio: 0.95,
    shiftDownRatio: 0.35,
    shiftTime: 0.22,
  },
  brakes: {
    frontBias: 0.62,
    absSlipRatio: 0.2,
    absTorqueFactor: 0.25,
    handbrakeTorqueFactor: 0.5,
  },
  aero: {
    airDensity: 1.2,
    dragArea: 0.75,
    downforceArea: 0.3,
    rollingResistance: 0.015,
  },
  suspension: {
    targetRollAngleRad: 0.06,
    dampingRatio: 0.7,
    arbFrontFactor: 0.15,
    arbRearFactor: 0.1,
    rollClampRad: 0.18,
    pitchClampRad: 0.12,
  },
  stability: {
    enabled: true,
    yawErrorThreshold: 0.12,
    correctionGain: 3.0,
    throttleCutGain: 2.0,
    maxThrottleCut: 0.7,
    tractionSlipLimit: 0.25,
  },
  limits: {
    pathAngleRad: 0.5,
    slipAngleRad: 0.35,
    headingAngleRad: 0.7,
    yawRateRad: 2.5,
  },
  yawDamping: 0.4,
  lowSpeedSlipReference: 2.0,
  differentialLock: 0.25,
  substepSeconds: 1 / 480,
};

/** Visual-only tire marks and wheel animation tuning. */
export const SKID_TUNING = {
  slipAngleThreshold: 0.08,
  minSpeed: 8,
  markWidth: 0.26,
  markLength: 1.3,
  spacing: 0.5,
  poolSize: 160,
  opacity: 0.35,
};

/** Visual-only speed streaks around the car at high speed. */
export const SPEED_LINES_TUNING = {
  count: 90,
  minSpeedRatio: 0.25,
  maxOpacity: 0.5,
  xSpread: 14,
  yMin: 0.5,
  yMax: 7,
  zNear: -6,
  zFar: -60,
  recycleZ: 9,
  speedScale: 2.2,
  minLength: 1.5,
  maxLength: 5,
};

/** Global difficulty ramp — how traffic density scales over a run. A map's
 *  `difficultyMultiplier` scales the time axis of this curve. */
export const DIFFICULTY_CURVE = {
  /** Seconds of a run for traffic pressure to reach full difficulty. */
  rampSeconds: 120,
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
