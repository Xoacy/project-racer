import * as THREE from 'three';
import type { PlayerState } from '@/gameplay/types';
import { SPEED_LINES_TUNING } from '@/config/constants';
import { clamp, randRange } from '@/utils/MathUtils';

interface Streak {
  x: number;
  y: number;
  z: number;
  length: number;
}

/**
 * Decorative wind streaks around the car. Presentation-only: reads
 * PlayerState, never gameplay state. Opacity ramps in with the same speed
 * ratio shown on the HUD speedometer.
 */
export class SpeedLines {
  readonly root = new THREE.Group();
  private streaks: Streak[] = [];
  private positions: Float32Array;
  private geometry = new THREE.BufferGeometry();
  private material = new THREE.LineBasicMaterial({
    color: 0xfff1d0,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  private lines: THREE.LineSegments;

  constructor() {
    const count = SPEED_LINES_TUNING.count;
    this.positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      this.streaks.push({
        x: randRange(-SPEED_LINES_TUNING.xSpread, SPEED_LINES_TUNING.xSpread),
        y: randRange(SPEED_LINES_TUNING.yMin, SPEED_LINES_TUNING.yMax),
        z: randRange(SPEED_LINES_TUNING.zFar, SPEED_LINES_TUNING.zNear),
        length: randRange(SPEED_LINES_TUNING.minLength, SPEED_LINES_TUNING.maxLength),
      });
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.lines.frustumCulled = false;
    this.root.add(this.lines);
  }

  update(dt: number, state: PlayerState): void {
    const speedRatio = clamp(state.speed / state.maxSpeed, 0, 1);
    const visible = speedRatio > SPEED_LINES_TUNING.minSpeedRatio;
    this.lines.visible = visible;
    if (!visible) return;

    const strength =
      (speedRatio - SPEED_LINES_TUNING.minSpeedRatio) /
      (1 - SPEED_LINES_TUNING.minSpeedRatio);
    this.material.opacity = clamp(strength, 0, 1) * SPEED_LINES_TUNING.maxOpacity;
    this.root.position.x = state.currentX;

    const travel = state.speed * dt * SPEED_LINES_TUNING.speedScale;
    for (let i = 0; i < this.streaks.length; i++) {
      const streak = this.streaks[i];
      streak.z += travel;
      if (streak.z > SPEED_LINES_TUNING.recycleZ) {
        streak.x = randRange(-SPEED_LINES_TUNING.xSpread, SPEED_LINES_TUNING.xSpread);
        streak.y = randRange(SPEED_LINES_TUNING.yMin, SPEED_LINES_TUNING.yMax);
        streak.z = SPEED_LINES_TUNING.zFar - randRange(0, 10);
        streak.length = randRange(SPEED_LINES_TUNING.minLength, SPEED_LINES_TUNING.maxLength);
      }
      const base = i * 6;
      this.positions[base] = streak.x;
      this.positions[base + 1] = streak.y;
      this.positions[base + 2] = streak.z;
      this.positions[base + 3] = streak.x;
      this.positions[base + 4] = streak.y;
      this.positions[base + 5] = streak.z + streak.length;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.root.clear();
  }
}
