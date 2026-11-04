import type { VehicleConfig } from './types';

export const raceRunner: VehicleConfig = {
  id: 'race_runner',
  name: 'Race Runner',
  modelPath: 'models/vehicles/race_runner.glb',
  dimensions: { width: 1.9, height: 1.071, length: 3.741 },
  placeholderColor: 0xf4a261,
  physics: {
    maxSpeed: 58,
    acceleration: 18,
    deceleration: 24,
    lateralMaxSpeed: 10,
    lateralAcceleration: 38,
    lateralDeceleration: 44,
  },
};
