import type { VehicleConfig } from './types';

export const suvLuxury: VehicleConfig = {
  id: 'suv_luxury',
  name: 'SUV Luxury',
  modelPath: 'models/vehicles/suv_luxury.glb',
  dimensions: { width: 1.9, height: 1.647, length: 3.61 },
  placeholderColor: 0x264653,
  physics: {
    maxSpeed: 44,
    acceleration: 10,
    deceleration: 18,
    lateralMaxSpeed: 7,
    lateralAcceleration: 24,
    lateralDeceleration: 28,
  },
};
