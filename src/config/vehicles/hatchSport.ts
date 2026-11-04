import type { VehicleConfig } from './types';

export const hatchSport: VehicleConfig = {
  id: 'hatch_sport',
  name: 'Hatch Sport',
  drivetrain: 'fwd',
  modelPath: 'models/vehicles/hatch_sport.glb',
  dimensions: { width: 1.9, height: 1.608, length: 4.165 },
  placeholderColor: 0x2a9d8f,
  physics: {
    maxSpeed: 50,
    acceleration: 15,
    deceleration: 21,
    lateralMaxSpeed: 9.5,
    lateralAcceleration: 34,
    lateralDeceleration: 40,
  },
};
