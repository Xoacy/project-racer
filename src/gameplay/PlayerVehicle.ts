import type { VehicleConfig } from '@/config/vehicles';
import type { MapConfig } from '@/config/maps';
import type { PlayerState } from './types';
import { clamp, moveTowards } from '@/utils/MathUtils';
import { WORLD } from '@/config/constants';

/**
 * Pure gameplay state — no THREE.js objects, no rendering. This is the
 * "logic" half of the state/presentation split: VehicleView reads a
 * PlayerState snapshot from here every frame but never writes back into it.
 *
 * Lateral movement is free and continuous: `x` can be anywhere within the
 * road's width, not snapped to lane centers. Lanes are purely a visual
 * reference drawn by Track — nothing here knows or cares where they are.
 */
export class PlayerVehicle {
  private roadHalfWidth: number;
  private vehicleHalfWidth: number;

  private x = 0;
  private previousX = 0;
  /** Current sideways velocity (m/s), separate from x so it can carry
   *  acceleration/deceleration/rebound across frames like real momentum. */
  private lateralSpeed = 0;

  private speed: number;
  private previousSpeed: number;
  private distanceTraveled = 0;
  private lastDt = 1 / 60;

  constructor(private vehicle: VehicleConfig, map: MapConfig) {
    this.roadHalfWidth = (map.lanes.count * map.lanes.width) / 2;
    this.vehicleHalfWidth = vehicle.dimensions.width / 2;
    this.speed = vehicle.physics.maxSpeed * 0.45;
    this.previousSpeed = this.speed;
  }

  /** `lateralInput` is analog, in [-1, 1]: full left, full right, or
   *  anywhere between for sources that support variable intensity. */
  update(dt: number, lateralInput: number, braking: boolean, targetSpeed: number): void {
    const input = clamp(lateralInput, -1, 1);
    const targetLateralSpeed = input * this.vehicle.physics.lateralMaxSpeed;

    // Accelerate while ramping up toward a stronger target, decelerate
    // while easing off (including through a direction reversal, which
    // naturally decelerates to 0 first and then accelerates the other way
    // once the target's magnitude overtakes the current speed again).
    const isRampingUp = Math.abs(targetLateralSpeed) > Math.abs(this.lateralSpeed);
    const rate = isRampingUp ? this.vehicle.physics.lateralAcceleration : this.vehicle.physics.lateralDeceleration;
    this.lateralSpeed = moveTowards(this.lateralSpeed, targetLateralSpeed, rate * dt);

    this.previousX = this.x;
    const maxX = this.roadHalfWidth - this.vehicleHalfWidth;
    const proposedX = this.x + this.lateralSpeed * dt;
    if (proposedX > maxX) {
      this.x = maxX;
      this.lateralSpeed = -Math.abs(this.lateralSpeed) * WORLD.edgeBounceFactor;
    } else if (proposedX < -maxX) {
      this.x = -maxX;
      this.lateralSpeed = Math.abs(this.lateralSpeed) * WORLD.edgeBounceFactor;
    } else {
      this.x = proposedX;
    }

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
      currentX: this.x,
      speed: this.speed,
      distanceTraveled: this.distanceTraveled,
      lateralVelocity: (this.x - this.previousX) / this.lastDt,
      acceleration: (this.speed - this.previousSpeed) / this.lastDt,
      maxSpeed: this.vehicle.physics.maxSpeed,
    };
  }

  get dimensions() {
    return this.vehicle.dimensions;
  }
}
