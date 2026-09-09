import type * as THREE from 'three';
import type { NpcDriver } from './NpcDriver';

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
  /** The AI/logic side — x/z/speed here are authoritative; `group`'s
   *  transform is just a visual mirror of it, synced each frame. */
  driver: NpcDriver;
}

export interface SceneryInstance {
  mesh: THREE.Object3D;
}
