import type * as THREE from 'three';

export interface PlayerState {
  currentX: number; // meters, free lateral position (0 = road center)
  speed: number; // m/s
  distanceTraveled: number; // meters
  lateralVelocity: number; // m/s, for roll juice
  acceleration: number; // m/s^2 signed, for pitch juice
  maxSpeed: number;
}

export interface TrafficInstance {
  group: THREE.Group;
  /** Which lane slot this instance spawned in — only used internally by
   *  TrafficSpawner to avoid repeating the same lane; collision uses the
   *  instance's actual world X position (group.position.x), not this. */
  laneIndex: number;
  speed: number;
  halfLength: number;
  halfWidth: number;
}

export interface SceneryInstance {
  mesh: THREE.Object3D;
}
