import { clamp } from '@/utils/MathUtils';
import { VEHICLE_SIM_TUNING } from '@/config/constants';

interface Corner {
  l: number;
  t: number;
  staticLoad: number;
}

/**
 * Three-DOF sprung body (heave, pitch, roll) on four springs/dampers plus
 * front/rear anti-roll bars. The per-wheel normal loads produced here feed
 * the tire model, so longitudinal/lateral load transfer emerges from the
 * body dynamics instead of a static formula.
 */
export class Suspension {
  private readonly mass: number;
  private readonly cgHeight: number;
  private readonly rollInertia: number;
  private readonly pitchInertia: number;
  private readonly cornerStiffness: number;
  private readonly cornerDamping: number;
  private readonly arbFront: number;
  private readonly arbRear: number;

  private heave = 0;
  private heaveRate = 0;
  private roll = 0;
  private rollRate = 0;
  private pitch = 0;
  private pitchRate = 0;

  constructor(
    private readonly corners: Corner[],
    mass: number,
    track: number,
    wheelbase: number,
    cgHeight: number,
    targetRollAngle: number
  ) {
    this.mass = mass;
    this.cgHeight = cgHeight;
    this.rollInertia = (mass * (track * track + cgHeight * cgHeight)) / 6;
    this.pitchInertia = (mass * (wheelbase * wheelbase + cgHeight * cgHeight)) / 6;

    const gravity = 9.81;
    const dampingRatio = VEHICLE_SIM_TUNING.suspension.dampingRatio;
    this.cornerStiffness =
      (mass * gravity * cgHeight) / (targetRollAngle * ((track * track) / 2));
    this.cornerDamping = 2 * dampingRatio * Math.sqrt(this.cornerStiffness * (mass / 4));
    this.arbFront =
      this.cornerStiffness * VEHICLE_SIM_TUNING.suspension.arbFrontFactor;
    this.arbRear =
      this.cornerStiffness * VEHICLE_SIM_TUNING.suspension.arbRearFactor;
  }

  get bodyRoll(): number {
    return this.roll;
  }

  get bodyPitch(): number {
    return this.pitch;
  }

  get bodyHeave(): number {
    return this.heave;
  }

  update(h: number, ax: number, ay: number, downforce: number): number[] {
    const forces: number[] = [];
    const loads: number[] = [];

    for (const corner of this.corners) {
      const displacement = this.heave + this.pitch * corner.l + this.roll * corner.t;
      const velocity =
        this.heaveRate + this.pitchRate * corner.l + this.rollRate * corner.t;
      forces.push(-this.cornerStiffness * displacement - this.cornerDamping * velocity);
    }

    const arbCompression = (i: number, j: number): number =>
      this.cornerDisplacement(i) - this.cornerDisplacement(j);
    const frontBar = this.arbFront * -arbCompression(0, 1);
    const rearBar = this.arbRear * -arbCompression(2, 3);
    forces[0] += frontBar;
    forces[1] -= frontBar;
    forces[2] += rearBar;
    forces[3] -= rearBar;

    for (let i = 0; i < this.corners.length; i++) {
      loads.push(Math.max(0, this.corners[i].staticLoad + forces[i] + downforce / 4));
    }

    const heaveAcceleration = forces.reduce((sum, force) => sum + force, 0) / this.mass;
    const rollAcceleration =
      (forces.reduce((sum, force, i) => sum + force * this.corners[i].t, 0) +
        this.mass * ay * this.cgHeight) /
      this.rollInertia;
    const pitchAcceleration =
      (forces.reduce((sum, force, i) => sum + force * this.corners[i].l, 0) +
        this.mass * ax * this.cgHeight) /
      this.pitchInertia;

    this.heaveRate += heaveAcceleration * h;
    this.heave += this.heaveRate * h;
    this.rollRate += rollAcceleration * h;
    this.roll = clamp(
      this.roll + this.rollRate * h,
      -VEHICLE_SIM_TUNING.suspension.rollClampRad,
      VEHICLE_SIM_TUNING.suspension.rollClampRad
    );
    this.pitchRate += pitchAcceleration * h;
    this.pitch = clamp(
      this.pitch + this.pitchRate * h,
      -VEHICLE_SIM_TUNING.suspension.pitchClampRad,
      VEHICLE_SIM_TUNING.suspension.pitchClampRad
    );

    return loads;
  }

  private cornerDisplacement(index: number): number {
    const corner = this.corners[index];
    return this.heave + this.pitch * corner.l + this.roll * corner.t;
  }
}
