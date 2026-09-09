import type { VehicleConfig } from './types';

/** The "hero" test vehicle — this is the slot the user's first Blender/glTF
 *  export will plug into once the Blender -> glTF -> Three.js pipeline is
 *  validated. Until then it renders as a placeholder box. */
export const sedanHero: VehicleConfig = {
  id: 'sedan_hero',
  name: 'Sedan Hero',
  // modelPath: 'models/vehicles/sedan_hero.glb', // uncomment once exported
  dimensions: { width: 1.8, height: 1.3, length: 4.2 },
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
