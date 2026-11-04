import type { VehicleConfig } from '@/config/vehicles';
import { VEHICLE_SIM_TUNING } from '@/config/constants';
import { clamp } from '@/utils/MathUtils';

export class Powertrain {
  readonly gearRatios = VEHICLE_SIM_TUNING.engine.gearRatios;
  readonly finalDrive: number;
  readonly peakTorque: number;
  readonly drivenCount: number;

  gear = 1;
  rpm = VEHICLE_SIM_TUNING.engine.idleRpm;
  shiftTimer = 0;

  constructor(vehicle: VehicleConfig, mass: number, wheelRadius: number) {
    const engine = VEHICLE_SIM_TUNING.engine;
    const topGear = this.gearRatios[this.gearRatios.length - 1];
    const redlineRad = (engine.redlineRpm * 2 * Math.PI) / 60;
    this.finalDrive = redlineRad * wheelRadius / (vehicle.physics.maxSpeed * topGear);
    this.peakTorque =
      (mass * vehicle.physics.acceleration * engine.accelerationMultiplier * wheelRadius) /
      (this.gearRatios[0] * this.finalDrive * engine.efficiency);
    this.drivenCount = vehicle.drivetrain === 'awd' ? 4 : 2;
  }

  /** Returns the torque delivered to each driven wheel. */
  update(dt: number, throttle: number, drivenWheelSpeed: number): number {
    const engine = VEHICLE_SIM_TUNING.engine;
    const gearRatio = this.gearRatios[this.gear - 1];
    this.rpm = clamp(
      (Math.abs(drivenWheelSpeed) * gearRatio * this.finalDrive * 60) / (2 * Math.PI),
      engine.idleRpm,
      engine.redlineRpm * 1.05
    );

    if (this.shiftTimer > 0) {
      this.shiftTimer = Math.max(0, this.shiftTimer - dt);
    } else if (this.rpm > engine.redlineRpm * engine.shiftUpRatio && this.gear < this.gearRatios.length) {
      this.gear++;
      this.shiftTimer = engine.shiftTime;
    } else if (this.rpm < engine.redlineRpm * engine.shiftDownRatio && this.gear > 1) {
      this.gear--;
      this.shiftTimer = engine.shiftTime * 0.8;
    }

    if (this.shiftTimer > 0) return 0;

    const ratio = this.rpm / engine.redlineRpm;
    const peakRatio = 0.65;
    const curve = clamp(
      1 - 0.65 * Math.pow((ratio - peakRatio) / peakRatio, 2),
      engine.torqueCurveFloor,
      1
    );
    const engineTorque =
      throttle > 0.02
        ? this.peakTorque * curve * throttle
        : -this.peakTorque * engine.engineBrakeFactor * (0.5 + ratio);

    return (
      (engineTorque * gearRatio * this.finalDrive * engine.efficiency) / this.drivenCount
    );
  }
}
