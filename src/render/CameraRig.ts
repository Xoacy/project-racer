import * as THREE from 'three';
import type { PlayerState } from '@/gameplay/types';
import { JUICE_TUNING } from '@/config/constants';
import { clamp, expSmooth } from '@/utils/MathUtils';

const FOLLOW_OFFSET = new THREE.Vector3(0, 4.2, 6.5);
const LOOK_AHEAD_Z = -5;
const LOOK_AHEAD_HEIGHT = 0;

/**
 * Chase camera: smoothly follows the player's lateral position (so lane
 * changes don't whip the camera instantly) and adds a small speed-based FOV
 * kick for extra sense of speed. Purely presentational, reads PlayerState
 * only.
 */
export class CameraRig {
  private currentX = 0;
  private currentFov = JUICE_TUNING.camera.fovBase;

  update(dt: number, camera: THREE.PerspectiveCamera, state: PlayerState): void {
    this.currentX = expSmooth(this.currentX, state.currentX, JUICE_TUNING.camera.followLerpRate, dt);

    camera.position.set(this.currentX + FOLLOW_OFFSET.x, FOLLOW_OFFSET.y, FOLLOW_OFFSET.z);
    camera.lookAt(this.currentX, LOOK_AHEAD_HEIGHT, LOOK_AHEAD_Z);

    const speedRatio = clamp(state.speed / state.maxSpeed, 0, 1);
    const fovTarget = JUICE_TUNING.camera.fovBase + speedRatio * JUICE_TUNING.camera.fovMaxBoost;
    this.currentFov = expSmooth(this.currentFov, fovTarget, JUICE_TUNING.camera.fovLerpRate, dt);
    if (Math.abs(camera.fov - this.currentFov) > 0.01) {
      camera.fov = this.currentFov;
      camera.updateProjectionMatrix();
    }
  }
}
