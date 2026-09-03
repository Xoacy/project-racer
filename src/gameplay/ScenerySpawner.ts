import * as THREE from 'three';
import type { MapConfig } from '@/config/maps';
import { createPlaceholderProp } from '@/render/PlaceholderFactory';
import { WORLD } from '@/config/constants';
import { randInt, randRange } from '@/utils/MathUtils';
import type { SceneryInstance } from './types';

const SPAWN_Z = -150;

/**
 * Purely decorative roadside props. Unlike traffic, these scroll at full
 * world speed (they're static relative to the road), so no relative-speed
 * math is needed here.
 */
export class ScenerySpawner {
  readonly root = new THREE.Group();
  private active: SceneryInstance[] = [];
  private distanceSinceLastSpawn = 0;

  constructor(private map: MapConfig, private roadHalfWidth: number) {}

  update(dt: number, worldSpeed: number): void {
    this.distanceSinceLastSpawn += worldSpeed * dt;
    if (this.distanceSinceLastSpawn >= this.map.scenery.spawnInterval) {
      this.distanceSinceLastSpawn = 0;
      this.spawnPair();
    }

    const delta = worldSpeed * dt;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const instance = this.active[i];
      instance.mesh.position.z += delta;
      if (instance.mesh.position.z > WORLD.cullDistanceBehind) {
        this.root.remove(instance.mesh);
        this.disposeInstance(instance);
        this.active.splice(i, 1);
      }
    }
  }

  private spawnPair(): void {
    for (const side of [-1, 1]) {
      const color = this.map.scenery.propColors[randInt(0, this.map.scenery.propColors.length - 1)];
      const mesh = createPlaceholderProp(color);
      const x = side * (this.roadHalfWidth + 4 + randRange(0, 6));
      mesh.position.x = x;
      mesh.position.z = SPAWN_Z + randRange(-8, 8);
      this.root.add(mesh);
      this.active.push({ mesh });
    }
  }

  private disposeInstance(instance: SceneryInstance): void {
    instance.mesh.traverse((obj) => {
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
