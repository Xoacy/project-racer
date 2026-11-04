import * as THREE from 'three';
import type { VehicleConfig } from '@/config/vehicles';
import type { PlayerState } from '@/gameplay/types';
import type { AssetLoader } from '@/core/AssetLoader';
import { createPlaceholderBox } from './PlaceholderFactory';
import { expSmooth } from '@/utils/MathUtils';

/**
 * Presentation-only wrapper around the player's 3D model. `root` is driven
 * directly by game state each frame (position = where the car logically
 * is); `tiltGroup` is a nested child that ONLY procedural juice code
 * touches (roll/pitch). Gameplay code never reads or writes tiltGroup, and
 * this class never touches gameplay state — it only reads a PlayerState
 * snapshot. That separation is what keeps collision/scoring numerically
 * exact regardless of how the visuals are tuned.
 */
export class VehicleView {
  readonly root = new THREE.Group();
  private tiltGroup = new THREE.Group();
  private modelContainer = new THREE.Group();

  private roll = 0;
  private pitch = 0;
  private wheels: { node: THREE.Object3D; front: boolean }[] = [];
  private wheelRadius: number;

  constructor(private assetLoader: AssetLoader, vehicle: VehicleConfig) {
    this.wheelRadius = Math.max(0.25, vehicle.dimensions.height * 0.22);
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
    // GLTFLoader leaves every mesh with castShadow/receiveShadow off, so a
    // real model would float shadowless over the road while the
    // placeholder box (which sets these itself) did not.
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.modelContainer.clear();
    this.modelContainer.add(object);
    this.collectWheels(object);
  }

  private collectWheels(object: THREE.Object3D): void {
    this.wheels = [];
    object.traverse((child) => {
      const name = child.name.toLowerCase();
      if (!name.includes('wheel')) return;
      child.rotation.order = 'YXZ';
      this.wheels.push({ node: child, front: name.includes('front') });
    });
  }

  update(dt: number, state: PlayerState): void {
    // Logical position — no smoothing here, PlayerVehicle already did that.
    this.root.position.x = state.currentX;
    this.root.position.z = 0;
    // Model forward is -Z, so a right-hand yaw is a negative Y rotation.
    this.root.rotation.y = -state.yaw;

    this.roll = expSmooth(this.roll, state.bodyRoll, 12, dt);
    this.pitch = expSmooth(this.pitch, state.bodyPitch, 12, dt);
    this.tiltGroup.rotation.z = this.roll;
    this.tiltGroup.rotation.x = this.pitch;

    const spin = (-state.speed / this.wheelRadius) * dt;
    for (const wheel of this.wheels) {
      wheel.node.rotation.x += spin;
      if (wheel.front) wheel.node.rotation.y = -state.steerAngle;
    }
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
