import * as THREE from 'three';
import type { MapConfig } from '@/config/maps';
import { createSurfaceMaterial } from '@/render/MaterialFactory';
import { WORLD } from '@/config/constants';

interface RoadSegment {
  group: THREE.Group;
}

/**
 * Procedural infinite road: a small pool of segment meshes is recycled
 * (moved from behind the camera back to the front) instead of building an
 * unbounded road. This is the seam for future per-map segment variety
 * (curves, elevation, branching props) — today each segment is a flat slab
 * plus lane dividers, entirely driven by MapConfig.
 */
export class Track {
  readonly root = new THREE.Group();
  private segments: RoadSegment[] = [];
  private roadWidth: number;

  constructor(private map: MapConfig) {
    this.roadWidth = map.lanes.count * map.lanes.width;
    this.buildGround();
    // Tile segments contiguously starting just behind the cull line so the
    // very first one always covers the player's fixed z=0 position — with
    // the old formula there was a gap of bare ground right at the player.
    const firstCenterZ = WORLD.cullDistanceBehind - map.segmentLength / 2;
    for (let i = 0; i < map.activeSegments; i++) {
      const segment = this.buildSegment();
      segment.group.position.z = firstCenterZ - i * map.segmentLength;
      this.segments.push(segment);
      this.root.add(segment.group);
    }
  }

  private buildGround(): void {
    // Wide, cheap backdrop plane so the world doesn't look like it ends past
    // the road shoulders. Scrolls together with segments in update().
    const geometry = new THREE.PlaneGeometry(400, 4000);
    const material = createSurfaceMaterial({ color: this.map.theme.groundColor });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.root.add(ground);
  }

  private buildSegment(): RoadSegment {
    const group = new THREE.Group();

    const roadGeometry = new THREE.PlaneGeometry(this.roadWidth, this.map.segmentLength);
    const roadMaterial = createSurfaceMaterial({ color: this.map.theme.roadColor });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    group.add(road);

    const shoulderGeometry = new THREE.PlaneGeometry(3, this.map.segmentLength);
    const shoulderMaterial = createSurfaceMaterial({ color: this.map.theme.shoulderColor });
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.x = side * (this.roadWidth / 2 + 1.5);
      shoulder.receiveShadow = true;
      group.add(shoulder);
    }

    const dashedLineMaterial = createSurfaceMaterial({ color: this.map.theme.laneLineColor });
    const centerLineMaterial = createSurfaceMaterial({ color: this.map.theme.centerDividerColor });
    const laneDirections = this.map.traffic.laneDirections;

    for (let lane = 1; lane < this.map.lanes.count; lane++) {
      const x = -this.roadWidth / 2 + lane * this.map.lanes.width;
      // A dashed lane line between lanes running the same way; a solid
      // double line — the universal "do not cross" road marking — where
      // the direction actually flips (only ever happens on a two-way map).
      const isDirectionBoundary = laneDirections[lane - 1] !== laneDirections[lane];

      if (isDirectionBoundary) {
        for (const offset of [-0.08, 0.08]) {
          const solidGeometry = new THREE.PlaneGeometry(0.15, this.map.segmentLength);
          const solid = new THREE.Mesh(solidGeometry, centerLineMaterial);
          solid.rotation.x = -Math.PI / 2;
          solid.position.set(x + offset, 0.01, 0);
          group.add(solid);
        }
        continue;
      }

      const dashCount = 4;
      for (let d = 0; d < dashCount; d++) {
        const dashGeometry = new THREE.PlaneGeometry(0.15, this.map.segmentLength / (dashCount * 2));
        const dash = new THREE.Mesh(dashGeometry, dashedLineMaterial);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, -this.map.segmentLength / 2 + (d + 0.5) * (this.map.segmentLength / dashCount));
        group.add(dash);
      }
    }

    return { group };
  }

  update(dt: number, worldSpeed: number): void {
    const delta = worldSpeed * dt;
    let furthestAheadZ = Infinity;
    for (const segment of this.segments) {
      segment.group.position.z += delta;
      furthestAheadZ = Math.min(furthestAheadZ, segment.group.position.z);
    }

    const halfLength = this.map.segmentLength / 2;
    for (const segment of this.segments) {
      // A segment spans [z - halfLength, z + halfLength]. Its front edge
      // (z - halfLength, the smaller/more-negative side) is the LAST part
      // to clear any given point as the world scrolls, so recycling must
      // wait for THAT edge to pass the cull line — not the back edge. With
      // segmentLength (40) bigger than cullDistanceBehind (12), checking
      // the back edge recycled a segment while its front edge — the part
      // still covering the player at z=0 — hadn't passed yet, popping the
      // road out from under the car mid-flight.
      const frontEdgeZ = segment.group.position.z - halfLength;
      if (frontEdgeZ > WORLD.cullDistanceBehind) {
        segment.group.position.z = furthestAheadZ - this.map.segmentLength;
        furthestAheadZ = segment.group.position.z;
      }
    }
  }

  get laneWidth(): number {
    return this.map.lanes.width;
  }

  get roadHalfWidth(): number {
    return this.roadWidth / 2;
  }

  dispose(): void {
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
  }
}
