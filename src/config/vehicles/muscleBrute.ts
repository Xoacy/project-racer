import type { VehicleConfig } from './types';

/** Second vehicle, heavier and faster than sedanHero with slower
 *  handling — and the first one running a real model instead of a
 *  placeholder box. `dimensions` are measured off that model rather than
 *  picked by feel, so the collision box matches what's on screen. */
export const muscleBrute: VehicleConfig = {
  id: 'muscle_brute',
  name: 'Muscle Brute',
  drivetrain: 'rwd',
  modelPath: 'models/vehicles/muscle_brute.glb',
  dimensions: { width: 1.96, height: 1.34, length: 4.92 },
  // Matches the model's body paint, so the select-screen swatch (which
  // reads this) agrees with the car you actually get.
  placeholderColor: 0xa3251f,
  physics: {
    maxSpeed: 52,
    acceleration: 11,
    deceleration: 18,
    lateralMaxSpeed: 6.5,
    lateralAcceleration: 22,
    lateralDeceleration: 26,
  },
};
