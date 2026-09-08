import type { VehicleConfig } from '@/config/vehicles';
import type { MapConfig } from '@/config/maps';
import type { LaneDirection } from '@/core/input/InputTypes';
import type { PlayerState } from './types';
import { clamp, expSmooth } from '@/utils/MathUtils';

/**
 * Pure gameplay state — no THREE.js objects, no rendering. This is the
 * "logic" half of the state/presentation split: VehicleView reads a
 * PlayerState snapshot from here every frame but never writes back into it.
 */
export class PlayerVehicle {
  private laneCount: number;
  private laneWidth: number;

  private targetLaneIndex: number;
  private currentX: number;
  private previousX: number;

  private speed: number;
  private previousSpeed: number;
  private distanceTraveled = 0;
  private lastDt = 1 / 60;

  constructor(private vehicle: VehicleConfig, map: MapConfig) {
    this.laneCount = map.lanes.count;
    this.laneWidth = map.lanes.width;
    this.targetLaneIndex = Math.floor(this.laneCount / 2);
    this.currentX = this.laneIndexToX(this.targetLaneIndex);
    this.previousX = this.currentX;
    this.speed = vehicle.physics.maxSpeed * 0.45;
    this.previousSpeed = this.speed;
  }

  private laneIndexToX(laneIndex: number): number {
    return (laneIndex - (this.laneCount - 1) / 2) * this.laneWidth;
  }

  update(dt: number, laneRequests: LaneDirection[], braking: boolean, targetSpeed: number): void {
    // Each request just nudges targetLaneIndex by one lane (clamped to the
    // track's bounds). Crossing several lanes in one continuous glide is
    // just several requests landing before the glide finishes — the
    // easing below always chases whatever targetLaneIndex currently is,
    // so it naturally handles a target that keeps moving (or reverses
    // mid-transition) without any special-casing here.
    for (const dir of laneRequests) {
      this.targetLaneIndex = clamp(this.targetLaneIndex + dir, 0, this.laneCount - 1);
    }

    this.previousX = this.currentX;
    const targetX = this.laneIndexToX(this.targetLaneIndex);
    this.currentX = expSmooth(this.currentX, targetX, this.vehicle.physics.handling, dt);

    this.previousSpeed = this.speed;
    if (braking) {
      const brakeFloor = this.vehicle.physics.maxSpeed * 0.3;
      this.speed = Math.max(brakeFloor, this.speed - this.vehicle.physics.deceleration * dt);
    } else {
      if (this.speed < targetSpeed) {
        this.speed = Math.min(targetSpeed, this.speed + this.vehicle.physics.acceleration * dt);
      } else {
        this.speed = Math.max(targetSpeed, this.speed - this.vehicle.physics.deceleration * dt);
      }
    }

    this.distanceTraveled += this.speed * dt;
    this.lastDt = dt;
  }

  getState(): PlayerState {
    return {
      laneIndex: Math.round((this.currentX / this.laneWidth) + (this.laneCount - 1) / 2),
      currentX: this.currentX,
      speed: this.speed,
      distanceTraveled: this.distanceTraveled,
      lateralVelocity: (this.currentX - this.previousX) / this.lastDt,
      acceleration: (this.speed - this.previousSpeed) / this.lastDt,
      maxSpeed: this.vehicle.physics.maxSpeed,
    };
  }

  get dimensions() {
    return this.vehicle.dimensions;
  }
}
