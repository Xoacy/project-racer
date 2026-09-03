/**
 * Data-driven vehicle definition. Adding a new vehicle to the game means
 * adding one file that satisfies this shape and registering it in
 * `config/vehicles/index.ts` — no other code changes.
 */
export interface VehicleConfig {
  id: string;
  name: string;

  /** Path to the .gltf/.glb file, relative to /public. Left undefined while
   *  no model exists yet -> the game falls back to a placeholder box. */
  modelPath?: string;

  /** Bounding dimensions in meters, used both for the placeholder mesh and
   *  for collision checks (so collisions stay correct even before a real
   *  model exists). */
  dimensions: { width: number; height: number; length: number };

  /** Placeholder-only visuals. Ignored once modelPath resolves to a real model. */
  placeholderColor: number;

  /** Arcade physics tuning — NOT realistic units, just tuned-by-feel values. */
  physics: {
    /** Top speed in m/s the difficulty curve will ramp this vehicle towards. */
    maxSpeed: number;
    /** How fast (m/s^2) the vehicle re-accelerates back to target speed after braking. */
    acceleration: number;
    /** How fast (m/s^2) the vehicle slows down while braking. */
    deceleration: number;
    /** Lane-change responsiveness — higher = snappier lane changes. Used as an
     *  exponential-smoothing rate (1/seconds), not a real steering force. */
    handling: number;
  };
}
