import * as THREE from 'three';
import type { MapConfig } from '@/config/maps';
import { createPlaceholderBox } from '@/render/PlaceholderFactory';
import { WORLD } from '@/config/constants';
import { randInt, randRange } from '@/utils/MathUtils';
import { NpcDriver, type NpcNeighbor } from './NpcDriver';
import { buildLaneDirections, computeLaneGroups, findLaneGroup, type LaneGroup, type TrafficDirection } from './LaneDirections';
import type { TrafficInstance } from './types';

const SPAWN_Z = -140;
const TRAFFIC_DIMENSIONS = { width: 1.9, height: 1.5, length: 4.4 };
/** Same-direction traffic. */
const TRAFFIC_COLORS = [0xf1faee, 0xe9c46a, 0x8d99ae, 0x6b705c, 0xadb5bd];
/** Oncoming traffic gets its own palette so a two-way map's contraflow
 *  reads clearly even with placeholder boxes (real models will also be
 *  rotated 180°, see spawnOne — but color is what actually reads as
 *  "different" until then). */
const ONCOMING_TRAFFIC_COLORS = [0xe63946, 0xd62828, 0x9d0208, 0xbc3908];
const LANE_REPEAT_AVOID = 2; // don't spawn in the same lane more than this many times in a row

/**
 * Spawns traffic and drives it with NpcDriver (car-following + occasional
 * lane changes — see NpcDriver.ts). Each instance scrolls at the
 * *relative* speed between the player and its own current speed (sign
 * flipped for oncoming traffic — see NpcDriver.update), same scroll-space
 * frame as everything else, so gaps between traffic instances stay
 * physically meaningful for the AI's own following logic.
 *
 * A map's `traffic.type` ("Tipo de Tráfego") is the only thing that
 * distinguishes a one-way map from a two-way one — this class has no
 * notion of "mode", it just spawns each vehicle into whichever lane group
 * its spawn lane belongs to (see LaneDirections.ts).
 */
export class TrafficSpawner {
  readonly root = new THREE.Group();
  private active: TrafficInstance[] = [];
  private distanceSinceLastSpawn = 0;
  private recentLanes: number[] = [];
  private laneDirections: TrafficDirection[];
  private laneGroups: LaneGroup[];

  constructor(private map: MapConfig) {
    this.laneDirections = buildLaneDirections(map.traffic.type, map.lanes.count);
    this.laneGroups = computeLaneGroups(this.laneDirections);
  }

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
      direction: driver.direction,
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

    const direction = this.laneDirections[lane];
    const laneGroup = findLaneGroup(this.laneGroups, lane);
    const isOncoming = direction === -1;

    const colors = isOncoming ? ONCOMING_TRAFFIC_COLORS : TRAFFIC_COLORS;
    const color = colors[randInt(0, colors.length - 1)];
    const mesh = createPlaceholderBox({ ...TRAFFIC_DIMENSIONS, color });

    const driver = new NpcDriver({
      laneCount: this.map.lanes.count,
      laneWidth: this.map.lanes.width,
      startLaneIndex: lane,
      allowedLaneMin: laneGroup.minLaneIndex,
      allowedLaneMax: laneGroup.maxLaneIndex,
      direction,
      cruiseSpeed: randRange(this.map.traffic.minSpeed, this.map.traffic.maxSpeed),
      halfWidth: TRAFFIC_DIMENSIONS.width / 2,
      halfLength: TRAFFIC_DIMENSIONS.length / 2,
      z: SPAWN_Z,
      safeFollowSeconds: this.map.traffic.safeFollowSeconds,
      laneChangeChanceMin: this.map.traffic.laneChangeChance.min,
      laneChangeChanceMax: this.map.traffic.laneChangeChance.max,
    });

    const group = new THREE.Group();
    // Oncoming traffic drives toward the player, so it faces the opposite
    // way — the correct foundation for when real (asymmetric) models
    // replace this placeholder box.
    group.rotation.y = isOncoming ? Math.PI : 0;
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
