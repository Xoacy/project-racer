import type { VehicleConfig } from './types';

/** Second vehicle, purely to prove the roster is data-driven: heavier,
 *  faster top speed, slower handling, no code duplicated from sedanHero. */
export const muscleBrute: VehicleConfig = {
  id: 'muscle_brute',
  name: 'Muscle Brute',
  dimensions: { width: 2.0, height: 1.35, length: 4.6 },
  placeholderColor: 0x1d3557,
  physics: {
    maxSpeed: 52,
    acceleration: 11,
    deceleration: 18,
    handling: 6.5,
  },
};
