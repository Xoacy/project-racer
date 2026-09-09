import * as THREE from 'three';
import type { MapConfig } from '@/config/maps';
import { createPlaceholderBox } from '@/render/PlaceholderFactory';
import { WORLD } from '@/config/constants';
import { randInt, randRange } from '@/utils/MathUtils';
import { NpcDriver, type NpcNeighbor } from './NpcDriver';
import type { TrafficInstance } from './types';

const SPAWN_Z = -140;
const TRAFFIC_DIMENSIONS = { width: 1.9, height: 1.5, length: 4.4 };
const TRAFFIC_COLORS = [0xf1faee, 0xe9c46a, 0x8d99ae, 0x6b705c, 0xadb5bd];
const LANE_REPEAT_AVOID = 2; // don't spawn in the same lane more than this many times in a row

/**
 * Spawns traffic and drives it with NpcDriver (car-following + occasional
 * lane changes — see NpcDriver.ts). Each instance scrolls at the
 * *relative* speed between the player and its own current speed, same
 * scroll-space frame as everything else, so gaps between traffic
 * instances stay physically meaningful for the AI's own following logic.
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

    // One shared snapshot per frame: each NPC's decisions this frame are
    // based on where everyone else was at the start of the frame, not a
    // partially-updated mix — avoids order-dependent behavior.
    const snapshot: NpcNeighbor[] = this.active.map(({ driver }) => ({
      x: driver.x,
      z: driver.z,
      halfWidth: driver.halfWidth,
      halfLength: driver.halfLength,
      speed: driver.speed,
    }));

    for (let i = this.active.length - 1; i >= 0; i--) {
      const instance = this.active[i];
      const neighbors = snapshot.length > 1 ? snapshot.filter((_, idx) => idx !== i) : [];
      instance.driver.update(dt, neighbors, playerSpeed);
      instance.group.position.set(instance.driver.x, 0, instance.driver.z);

      if (instance.driver.z > WORLD.cullDistanceBehind) {
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

    const color = TRAFFIC_COLORS[randInt(0, TRAFFIC_COLORS.length - 1)];
    const mesh = createPlaceholderBox({ ...TRAFFIC_DIMENSIONS, color });

    const driver = new NpcDriver({
      laneCount: this.map.lanes.count,
      laneWidth: this.map.lanes.width,
      startLaneIndex: lane,
      cruiseSpeed: randRange(this.map.traffic.minSpeed, this.map.traffic.maxSpeed),
      halfWidth: TRAFFIC_DIMENSIONS.width / 2,
      halfLength: TRAFFIC_DIMENSIONS.length / 2,
      z: SPAWN_Z,
    });

    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(driver.x, 0, driver.z);
    this.root.add(group);

    this.active.push({ group, driver });
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
