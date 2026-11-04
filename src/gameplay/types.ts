import type * as THREE from 'three';
import type { NpcDriver } from './NpcDriver';

export interface PlayerState {
  currentX: number; // meters, free lateral position (0 = road center)
  speed: number; // m/s
  distanceTraveled: number; // meters
  yaw: number; // radians, positive = pointing right
  steerAngle: number; // radians, positive = steering right
  slipAngle: number; // radians, positive = sliding right
  handbrake: boolean;
  maxSpeed: number;
  bodyRoll: number; // radians, positive = left side down
  bodyPitch: number; // radians, positive = nose up
  rpm: number;
  gear: number;
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
