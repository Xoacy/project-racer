import * as THREE from 'three';
import type { PlayerState } from '@/gameplay/types';
import { SKID_TUNING, WORLD } from '@/config/constants';

interface SkidMark {
  mesh: THREE.Mesh;
  active: boolean;
}

/**
 * Decorative tire marks behind the player while the rear is sliding. Purely
 * presentational: reads PlayerState, never writes gameplay state. Marks live
 * in world space and scroll toward the camera with the road.
 */
export class SkidMarks {
  readonly root = new THREE.Group();
  private marks: SkidMark[] = [];
  private nextIndex = 0;
  private distanceSinceSpawn = SKID_TUNING.spacing;
  private geometry: THREE.PlaneGeometry;
  private material: THREE.MeshBasicMaterial;
  private readonly rearOffset: number;
  private readonly halfTrack: number;

  constructor(dimensions: { width: number; length: number }) {
    this.rearOffset = dimensions.length * 0.3;
    this.halfTrack = dimensions.width * 0.38;

    this.geometry = new THREE.PlaneGeometry(SKID_TUNING.markWidth, SKID_TUNING.markLength);
    this.geometry.rotateX(-Math.PI / 2);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: SKID_TUNING.opacity,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    for (let i = 0; i < SKID_TUNING.poolSize; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.visible = false;
      mesh.renderOrder = 1;
      this.root.add(mesh);
      this.marks.push({ mesh, active: false });
    }
  }

  update(dt: number, state: PlayerState): void {
    const scroll = state.speed * dt;
    for (const mark of this.marks) {
      if (!mark.active) continue;
      mark.mesh.position.z += scroll;
      if (mark.mesh.position.z > WORLD.cullDistanceBehind) {
        mark.active = false;
        mark.mesh.visible = false;
      }
    }

    const sliding =
      state.speed > SKID_TUNING.minSpeed &&
      (state.handbrake || Math.abs(state.slipAngle) > SKID_TUNING.slipAngleThreshold);
    if (!sliding) {
      this.distanceSinceSpawn = SKID_TUNING.spacing;
      return;
    }

    this.distanceSinceSpawn += scroll;
    while (this.distanceSinceSpawn >= SKID_TUNING.spacing) {
      this.distanceSinceSpawn -= SKID_TUNING.spacing;
      this.spawnPair(state);
    }
  }

  private spawnPair(state: PlayerState): void {
    const cos = Math.cos(state.yaw);
    const sin = Math.sin(state.yaw);
    for (const side of [-1, 1]) {
      const localX = side * this.halfTrack;
      const x = state.currentX + localX * cos - sin * this.rearOffset;
      const z = localX * sin + cos * this.rearOffset;
      this.spawn(x, z, state.yaw);
    }
  }

  private spawn(x: number, z: number, yaw: number): void {
    const mark = this.marks[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.marks.length;
    mark.active = true;
    mark.mesh.visible = true;
    mark.mesh.position.set(x, 0.01, z);
    mark.mesh.rotation.y = -yaw;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.root.clear();
  }
}
