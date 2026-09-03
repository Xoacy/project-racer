import type * as THREE from 'three';

export interface PlayerState {
  laneIndex: number; // rounded, nearest lane
  currentX: number;
  speed: number; // m/s
  distanceTraveled: number; // meters
  lateralVelocity: number; // m/s, for roll juice
  acceleration: number; // m/s^2 signed, for pitch juice
  maxSpeed: number;
}

export interface TrafficInstance {
  group: THREE.Group;
  laneIndex: number;
  speed: number;
  halfLength: number;
}

export interface SceneryInstance {
  mesh: THREE.Object3D;
}
