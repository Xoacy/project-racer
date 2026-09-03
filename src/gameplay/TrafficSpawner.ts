import * as THREE from 'three';
import type { MapConfig } from '@/config/maps';
import { createPlaceholderBox } from '@/render/PlaceholderFactory';
import { WORLD } from '@/config/constants';
import { randInt, randRange } from '@/utils/MathUtils';
import type { TrafficInstance } from './types';

const SPAWN_Z = -140;
const TRAFFIC_DIMENSIONS = { width: 1.9, height: 1.5, length: 4.4 };
const TRAFFIC_COLORS = [0xf1faee, 0xe9c46a, 0x8d99ae, 0x6b705c, 0xadb5bd];
const LANE_REPEAT_AVOID = 2; // don't spawn in the same lane more than this many times in a row

/**
 * Spawns oncoming/slower traffic ahead of the player and scrolls it toward
 * the camera at the *relative* speed between the player and that vehicle —
 * this is what makes overtaking read correctly instead of traffic just
 * sliding at world speed like scenery does.
 */
export class TrafficSpawner {
  readonly root = new THREE.Group();
  private active: TrafficInstance[] = [];
  private distanceSinceLastSpawn = 0;
  private recentLanes: number[] = [];

  constructor(private map: MapConfig) {}

  update(dt: number, playerSpeed: number, spawnIntervalFactor: number): void {
    this.distanceSinceLastSpawn += playerSpeed * dt;
    const interval = this.map.traffic.baseSpawnInterval * spawnIntervalFactor;
    if (this.distanceSinceLastSpawn >= interval) {
      this.distanceSinceLastSpawn = 0;
      this.spawnOne();
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const instance = this.active[i];
      const relativeSpeed = playerSpeed - instance.speed;
      instance.group.position.z += relativeSpeed * dt;
      if (instance.group.position.z > WORLD.cullDistanceBehind) {
        this.root.remove(instance.group);
        this.disposeInstance(instance);
        this.active.splice(i, 1);
      }
    }
  }

  private spawnOne(): void {
    let lane = randInt(0, this.map.lanes.count - 1);
    if (this.recentLanes.length >= LANE_REPEAT_AVOID && this.recentLanes.every((l) => l === lane)) {
      lane = (lane + 1) % this.map.lanes.count;
    }
    this.recentLanes.push(lane);
    if (this.recentLanes.length > LANE_REPEAT_AVOID) this.recentLanes.shift();

    const x = (lane - (this.map.lanes.count - 1) / 2) * this.map.lanes.width;
    const color = TRAFFIC_COLORS[randInt(0, TRAFFIC_COLORS.length - 1)];
    const mesh = createPlaceholderBox({ ...TRAFFIC_DIMENSIONS, color });

    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(x, 0, SPAWN_Z);
    this.root.add(group);

    this.active.push({
      group,
      laneIndex: lane,
      speed: randRange(this.map.traffic.minSpeed, this.map.traffic.maxSpeed),
      halfLength: TRAFFIC_DIMENSIONS.length / 2,
    });
  }

  getActive(): TrafficInstance[] {
    return this.active;
  }

  private disposeInstance(instance: TrafficInstance): void {
    instance.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }

  dispose(): void {
    for (const instance of this.active) this.disposeInstance(instance);
    this.active = [];
  }
}
