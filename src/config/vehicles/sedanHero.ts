import type { VehicleConfig } from './types';

export const sedanHero: VehicleConfig = {
  id: 'sedan_hero',
  name: 'Sedan Hero',
  drivetrain: 'fwd',
  modelPath: 'models/vehicles/sedan_hero.glb',
  dimensions: { width: 1.9, height: 1.647, length: 3.23 },
  placeholderColor: 0xe63946,
  physics: {
    maxSpeed: 46, // ~165 km/h
    acceleration: 14,
    deceleration: 22,
    lateralMaxSpeed: 9,
    lateralAcceleration: 32,
    lateralDeceleration: 38,
  },
};
