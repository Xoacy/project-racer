import * as THREE from 'three';
import type { VehicleConfig } from '@/config/vehicles';
import type { PlayerState } from '@/gameplay/types';
import type { AssetLoader } from '@/core/AssetLoader';
import { createPlaceholderBox } from './PlaceholderFactory';
import { JUICE_TUNING } from '@/config/constants';
import { clamp, expSmooth } from '@/utils/MathUtils';

/**
 * Presentation-only wrapper around the player's 3D model. `root` is driven
 * directly by game state each frame (position = where the car logically
 * is); `tiltGroup` is a nested child that ONLY procedural juice code
 * touches (roll/pitch/bob). Gameplay code never reads or writes tiltGroup,
 * and this class never touches gameplay state — it only reads a PlayerState
 * snapshot. That separation is what keeps collision/scoring numerically
 * exact regardless of how bouncy the visuals get.
 */
export class VehicleView {
  readonly root = new THREE.Group();
  private tiltGroup = new THREE.Group();
  private modelContainer = new THREE.Group();

  private roll = 0;
  private pitch = 0;
  private bobPhase = 0;

  constructor(private assetLoader: AssetLoader, vehicle: VehicleConfig) {
    this.root.add(this.tiltGroup);
    this.tiltGroup.add(this.modelContainer);
    this.setModel(createPlaceholderBox({ ...vehicle.dimensions, color: vehicle.placeholderColor }));

    if (vehicle.modelPath) {
      this.assetLoader.loadModel(vehicle.modelPath).then((model) => {
        if (model) this.setModel(model);
      });
    }
  }

  private setModel(object: THREE.Object3D): void {
    this.modelContainer.clear();
    this.modelContainer.add(object);
  }

  update(dt: number, state: PlayerState): void {
    // Logical position — no smoothing here, PlayerVehicle already did that.
    this.root.position.x = state.currentX;
    this.root.position.z = 0;

    const rollTarget = clamp(
      -state.lateralVelocity * JUICE_TUNING.roll.radiansPerLateralSpeed,
      -JUICE_TUNING.roll.maxAngleRad,
      JUICE_TUNING.roll.maxAngleRad
    );
    this.roll = expSmooth(this.roll, rollTarget, JUICE_TUNING.roll.lerpRate, dt);

    const pitchTarget = clamp(
      -state.acceleration * JUICE_TUNING.pitch.radiansPerAcceleration,
      -JUICE_TUNING.pitch.maxAngleRad,
      JUICE_TUNING.pitch.maxAngleRad
    );
    this.pitch = expSmooth(this.pitch, pitchTarget, JUICE_TUNING.pitch.lerpRate, dt);

    this.bobPhase += dt * JUICE_TUNING.bob.frequencyHz * Math.PI * 2;
    const speedRatio = clamp(state.speed / state.maxSpeed, 0, 1);
    const bobAmplitude =
      JUICE_TUNING.bob.amplitudeMeters * (1 + speedRatio * JUICE_TUNING.bob.speedAmplitudeBoost);
    const bobOffset = Math.sin(this.bobPhase) * bobAmplitude;

    this.tiltGroup.rotation.z = this.roll;
    this.tiltGroup.rotation.x = this.pitch;
    this.tiltGroup.position.y = bobOffset;
  }

  dispose(): void {
    this.modelContainer.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
}
