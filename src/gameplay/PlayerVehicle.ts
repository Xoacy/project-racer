import type { VehicleConfig } from '@/config/vehicles';
import type { MapConfig } from '@/config/maps';
import type { PlayerState } from './types';
import { clamp, moveTowards } from '@/utils/MathUtils';
import { VEHICLE_SIM_TUNING, WORLD } from '@/config/constants';
import { computeTireForces } from './vehicle/TireModel';
import { Powertrain } from './vehicle/Powertrain';
import { Suspension } from './vehicle/Suspension';

interface Wheel {
  l: number;
  t: number;
  front: boolean;
  driven: boolean;
  inertia: number;
  omega: number;
  slipRatio: number;
  slipAngle: number;
  fz: number;
  fx: number;
  fy: number;
}

const GRAVITY = 9.81;

/**
 * Double-track vehicle model: four wheels with slip ratio/angle, a
 * spring/damper/anti-roll suspension producing per-wheel loads at 480 Hz,
 * and a torque-curve gearbox feeding the driven wheels. The endless-runner
 * world stays planar (car at z = 0, path/slip angles bounded), so the car
 * can't spin forever on a straight road.
 */
export class PlayerVehicle {
  private readonly roadHalfWidth: number;
  private readonly vehicleHalfWidth: number;
  private readonly mass: number;
  private readonly wheelbase: number;
  private readonly track: number;
  private readonly cgHeight: number;
  private readonly wheelRadius: number;
  private readonly cgToFront: number;
  private readonly cgToRear: number;
  private readonly yawInertia: number;
  private readonly muBase: number;
  private readonly brakeTorque: number;
  private readonly handbrakeTorque: number;
  private readonly staticFrontLoad: number;
  private readonly staticRearLoad: number;

  private readonly wheels: Wheel[];
  private readonly powertrain: Powertrain;
  private readonly suspension: Suspension;

  private x = 0;
  private speed = 0;
  private pathAngle = 0;
  private slipAngle = 0;
  private yawRate = 0;
  private steerAngle = 0;
  private throttle = 0;
  private brake = 0;
  private handbrake = false;
  private lastAx = 0;
  private lastAy = 0;
  private distanceTraveled = 0;

  constructor(private vehicle: VehicleConfig, map: MapConfig) {
    const { width, height, length } = vehicle.dimensions;
    const sim = VEHICLE_SIM_TUNING;
    this.roadHalfWidth = (map.lanes.count * map.lanes.width) / 2;
    this.vehicleHalfWidth = width / 2;

    this.mass = clamp(length * width * height * sim.massPerVolume, 700, 1900);
    this.wheelbase = length * sim.wheelbaseLengthRatio;
    this.track = width * sim.trackWidthRatio;
    this.cgHeight = height * sim.cgHeightRatio;
    this.wheelRadius = Math.max(0.25, height * sim.wheelRadiusHeightRatio);
    this.cgToFront = this.wheelbase * (1 - sim.frontWeightBias);
    this.cgToRear = this.wheelbase - this.cgToFront;
    this.yawInertia = (this.mass * (length * length + width * width)) / 12;

    this.muBase = clamp(
      (vehicle.physics.lateralAcceleration * sim.tire.gripScale) / GRAVITY,
      sim.tire.minMu,
      sim.tire.maxMu
    );
    this.brakeTorque = this.mass * vehicle.physics.deceleration * this.wheelRadius;
    this.handbrakeTorque = this.brakeTorque * sim.brakes.handbrakeTorqueFactor;

    this.staticFrontLoad = (this.mass * GRAVITY * sim.frontWeightBias) / 2;
    this.staticRearLoad = (this.mass * GRAVITY * (1 - sim.frontWeightBias)) / 2;

    const drivenFront = vehicle.drivetrain === 'fwd' || vehicle.drivetrain === 'awd';
    const drivenRear = vehicle.drivetrain === 'rwd' || vehicle.drivetrain === 'awd';
    const freeInertia = sim.wheelInertia;
    const drivenInertia = sim.drivenWheelInertia;
    this.wheels = [
      { l: this.cgToFront, t: -this.track / 2, front: true, driven: drivenFront, inertia: drivenFront ? drivenInertia : freeInertia, omega: 0, slipRatio: 0, slipAngle: 0, fz: this.staticFrontLoad, fx: 0, fy: 0 },
      { l: this.cgToFront, t: this.track / 2, front: true, driven: drivenFront, inertia: drivenFront ? drivenInertia : freeInertia, omega: 0, slipRatio: 0, slipAngle: 0, fz: this.staticFrontLoad, fx: 0, fy: 0 },
      { l: -this.cgToRear, t: -this.track / 2, front: false, driven: drivenRear, inertia: drivenRear ? drivenInertia : freeInertia, omega: 0, slipRatio: 0, slipAngle: 0, fz: this.staticRearLoad, fx: 0, fy: 0 },
      { l: -this.cgToRear, t: this.track / 2, front: false, driven: drivenRear, inertia: drivenRear ? drivenInertia : freeInertia, omega: 0, slipRatio: 0, slipAngle: 0, fz: this.staticRearLoad, fx: 0, fy: 0 },
    ];

    this.suspension = new Suspension(
      this.wheels.map((wheel) => ({
        l: wheel.l,
        t: wheel.t,
        staticLoad: wheel.front ? this.staticFrontLoad : this.staticRearLoad,
      })),
      this.mass,
      this.track,
      this.wheelbase,
      this.cgHeight,
      sim.suspension.targetRollAngleRad
    );
    this.powertrain = new Powertrain(vehicle, this.mass, this.wheelRadius);
  }

  update(dt: number, steerInput: number, throttle: number, brake: number, handbrake: boolean): void {
    this.handbrake = handbrake;
    this.throttle = moveTowards(this.throttle, clamp(throttle, 0, 1), 4 * dt);
    this.brake = moveTowards(this.brake, clamp(brake, 0, 1), 8 * dt);

    const input = clamp(steerInput, -1, 1);
    const speedRatio = clamp(this.speed / this.vehicle.physics.maxSpeed, 0, 1);
    const steerTarget =
      input *
      VEHICLE_SIM_TUNING.steer.maxAngleRad *
      (1 - speedRatio * VEHICLE_SIM_TUNING.steer.highSpeedLoss);
    const steerRate =
      Math.abs(steerTarget) > Math.abs(this.steerAngle)
        ? VEHICLE_SIM_TUNING.steer.rate
        : VEHICLE_SIM_TUNING.steer.returnRate;
    this.steerAngle = moveTowards(this.steerAngle, steerTarget, steerRate * dt);

    const steps = Math.max(1, Math.ceil(dt / VEHICLE_SIM_TUNING.substepSeconds));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) this.integrate(h);

    this.distanceTraveled += this.speed * dt;
  }

  private integrate(h: number): void {
    const sim = VEHICLE_SIM_TUNING;
    const downforce = 0.5 * sim.aero.airDensity * sim.aero.downforceArea * this.speed * this.speed;
    const loads = this.suspension.update(h, this.lastAx, this.lastAy, downforce);
    for (let i = 0; i < this.wheels.length; i++) this.wheels[i].fz = loads[i];

    const lateralVelocity = this.speed * Math.tan(this.slipAngle);
    const relaxationRate = Math.max(this.speed, sim.lowSpeedSlipReference) / sim.tire.relaxationLength;
    const blend = 1 - Math.exp(-relaxationRate * h);

    this.applyAckermannSteering();

    for (const wheel of this.wheels) {
      const wheelSpeed = Math.max(this.speed, sim.lowSpeedSlipReference);
      const wheelLateral = lateralVelocity + this.yawRate * wheel.l;
      const wheelSteer = wheel.front ? (wheel.t < 0 ? this.leftSteer : this.rightSteer) : 0;
      const targetSlipAngle = Math.atan2(wheelLateral, wheelSpeed) - wheelSteer;
      const targetSlipRatio = (wheel.omega * this.wheelRadius - this.speed) / wheelSpeed;
      wheel.slipAngle += (targetSlipAngle - wheel.slipAngle) * blend;
      wheel.slipRatio += (targetSlipRatio - wheel.slipRatio) * blend;

      const staticLoad = wheel.front ? this.staticFrontLoad : this.staticRearLoad;
      const loadRatio = wheel.fz / staticLoad;
      const axleGrip = wheel.front ? sim.tire.frontGripFactor : sim.tire.rearGripFactor;
      const mu = clamp(
        this.muBase * axleGrip * (1 - sim.tire.loadSensitivity * (loadRatio - 1)),
        this.muBase * 0.5,
        this.muBase * 1.3
      );
      const forces = computeTireForces(
        wheel.slipRatio,
        wheel.slipAngle,
        wheel.fz,
        mu,
        mu
      );
      wheel.fx = forces.fx;
      wheel.fy = forces.fy;
    }

    const gripYawRate = (this.muBase * GRAVITY) / Math.max(this.speed, 4);
    const desiredYawRate = clamp(
      (this.steerAngle * this.speed) / this.wheelbase,
      -gripYawRate,
      gripYawRate
    );
    const yawError = this.yawRate - desiredYawRate;
    let throttle = this.throttle;
    let stabilityCorrection = 0;
    if (sim.stability.enabled && this.speed > 4) {
      const excess = Math.max(0, Math.abs(yawError) - sim.stability.yawErrorThreshold);
      throttle *= clamp(
        1 - excess * sim.stability.throttleCutGain,
        1 - sim.stability.maxThrottleCut,
        1
      );
      stabilityCorrection =
        -Math.sign(yawError) * Math.min(Math.abs(yawError) * sim.stability.correctionGain, 2);
    }

    if (sim.stability.enabled) {
      for (const wheel of this.wheels) {
        if (!wheel.driven) continue;
        const slip = Math.abs(wheel.slipRatio);
        if (slip > sim.stability.tractionSlipLimit) {
          throttle *= sim.stability.tractionSlipLimit / slip;
        }
      }
    }

    const drivenWheels = this.wheels.filter((wheel) => wheel.driven);
    const drivenSpeed =
      drivenWheels.reduce((sum, wheel) => sum + wheel.omega * this.wheelRadius, 0) /
      drivenWheels.length;
    const driveTorque = this.powertrain.update(h, throttle, drivenSpeed);
    const driveAverageOmega =
      drivenWheels.reduce((sum, wheel) => sum + wheel.omega, 0) / drivenWheels.length;

    const brakeTotal = this.brakeTorque * this.brake;
    for (const wheel of this.wheels) {
      let wheelBrake =
        (wheel.front ? brakeTotal * sim.brakes.frontBias : brakeTotal * (1 - sim.brakes.frontBias)) / 2;
      if (this.handbrake && !wheel.front) wheelBrake += this.handbrakeTorque / 2;
      if (wheelBrake > 0) {
        const absFactor = clamp(
          sim.brakes.absSlipRatio / Math.max(Math.abs(wheel.slipRatio), 1e-3),
          sim.brakes.absTorqueFactor,
          1
        );
        wheelBrake *= absFactor;
      }

      let drive = 0;
      if (wheel.driven) {
        const lockBias = clamp(
          1 + sim.differentialLock * ((driveAverageOmega - wheel.omega) / Math.max(Math.abs(driveAverageOmega), 1)),
          0.5,
          1.5
        );
        drive = driveTorque * lockBias;
      }
      const brakeSign = wheel.omega > 0.05 ? 1 : 0;
      const netTorque = drive - wheel.fx * this.wheelRadius - wheelBrake * brakeSign;
      wheel.omega = Math.max(0, wheel.omega + (netTorque / wheel.inertia) * h);
    }

    let fxTotal = 0;
    let fyTotal = 0;
    let yawMoment = 0;
    for (const wheel of this.wheels) {
      fxTotal += wheel.fx;
      fyTotal += wheel.fy;
      yawMoment += wheel.l * wheel.fy - wheel.t * wheel.fx;
    }

    const drag = 0.5 * sim.aero.airDensity * sim.aero.dragArea * this.speed * this.speed;
    const rolling = this.mass * GRAVITY * sim.aero.rollingResistance;
    const ax = (fxTotal - drag - rolling) / this.mass;
    this.speed = clamp(this.speed + ax * h, 0, this.vehicle.physics.maxSpeed * 1.05);

    const ay = fyTotal / this.mass;
    const pathAcceleration = ay / Math.max(this.speed, sim.lowSpeedSlipReference);
    this.pathAngle += pathAcceleration * h;
    this.slipAngle += (pathAcceleration - this.yawRate) * h;
    this.yawRate +=
      (yawMoment / this.yawInertia +
        stabilityCorrection -
        sim.yawDamping * this.yawRate) *
      h;
    this.yawRate = clamp(this.yawRate, -sim.limits.yawRateRad, sim.limits.yawRateRad);

    const pathCap = Math.min(
      sim.limits.pathAngleRad,
      Math.atan(
        (this.vehicle.physics.lateralMaxSpeed * (this.handbrake ? 1.3 : 1)) /
          Math.max(this.speed, 4)
      )
    );
    this.pathAngle = clamp(this.pathAngle, -pathCap, pathCap);
    this.slipAngle = clamp(this.slipAngle, -sim.limits.slipAngleRad, sim.limits.slipAngleRad);
    const heading = clamp(
      this.pathAngle - this.slipAngle,
      -sim.limits.headingAngleRad,
      sim.limits.headingAngleRad
    );
    this.slipAngle = this.pathAngle - heading;

    this.lastAx = ax;
    this.lastAy = ay;

    const maxX = this.roadHalfWidth - this.vehicleHalfWidth;
    const proposedX = this.x + this.speed * Math.sin(this.pathAngle) * h;
    if (proposedX > maxX) {
      this.x = maxX;
      this.pathAngle = -Math.abs(this.pathAngle) * WORLD.edgeBounceFactor;
      this.slipAngle *= 0.5;
      this.yawRate *= 0.5;
    } else if (proposedX < -maxX) {
      this.x = -maxX;
      this.pathAngle = Math.abs(this.pathAngle) * WORLD.edgeBounceFactor;
      this.slipAngle *= 0.5;
      this.yawRate *= 0.5;
    } else {
      this.x = proposedX;
    }
  }

  private leftSteer = 0;
  private rightSteer = 0;

  private applyAckermannSteering(): void {
    const steer = this.steerAngle;
    this.leftSteer = steer;
    this.rightSteer = steer;
    if (Math.abs(steer) < 0.01) return;

    const radius = this.wheelbase / Math.tan(Math.abs(steer));
    const inner = Math.atan(this.wheelbase / Math.max(radius - this.track / 2, 0.5));
    const outer = Math.atan(this.wheelbase / (radius + this.track / 2));
    const sign = Math.sign(steer);
    if (sign > 0) {
      this.leftSteer = outer * sign;
      this.rightSteer = inner * sign;
    } else {
      this.leftSteer = inner * sign;
      this.rightSteer = outer * sign;
    }
  }

  getState(): PlayerState {
    return {
      currentX: this.x,
      speed: this.speed,
      distanceTraveled: this.distanceTraveled,
      yaw: this.pathAngle - this.slipAngle,
      steerAngle: this.steerAngle,
      slipAngle: this.slipAngle,
      handbrake: this.handbrake,
      maxSpeed: this.vehicle.physics.maxSpeed,
      bodyRoll: this.suspension.bodyRoll,
      bodyPitch: this.suspension.bodyPitch,
      rpm: this.powertrain.rpm,
      gear: this.powertrain.gear,
    };
  }

  get dimensions() {
    return this.vehicle.dimensions;
  }
}
