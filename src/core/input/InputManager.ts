import type { InputSource } from './InputTypes';
import { KeyboardSource } from './KeyboardSource';
import { TouchSource } from './TouchSource';
import { TiltSource } from './TiltSource';
import { getSteeringSensitivity } from './steeringSensitivity';
import { clamp } from '@/utils/MathUtils';

/**
 * Unified input aggregator. Every control scheme (keyboard, touch drag,
 * tilt) ultimately just calls `setLateralInput` / `setBraking` on this —
 * the gameplay layer only ever talks to InputManager, never to a specific
 * scheme, so adding e.g. a gamepad source later touches only this file.
 */
export class InputManager {
  /** Analog steering value in [-1, 1]: full left, full right, or anywhere
   *  between for sources that support variable intensity (touch drag,
   *  tilt angle). PlayerVehicle turns this into an actual lateral position
   *  via its own acceleration/deceleration curve — this class just carries
   *  the raw "how hard is the player steering right now" signal. */
  private lateralInput = 0;
  private throttleInput = 0;
  private brakeInput = 0;
  private handbrake = false;

  private keyboard: KeyboardSource;
  private touch: TouchSource;
  private tilt: TiltSource;
  private sources: InputSource[];

  constructor(surface: HTMLElement) {
    this.keyboard = new KeyboardSource(this);
    this.touch = new TouchSource(this, surface);
    this.tilt = new TiltSource(this);
    this.sources = [this.keyboard, this.touch, this.tilt];
  }

  attach(): void {
    this.sources.forEach((s) => s.attach());
  }

  detach(): void {
    this.sources.forEach((s) => s.detach());
  }

  /** Called by input sources whenever their steering value changes. */
  setLateralInput(value: number): void {
    this.lateralInput = value;
  }

  /** Called once per gameplay frame to read the current analog steering value. */
  getLateralInput(): number {
    return clamp(this.lateralInput * getSteeringSensitivity(), -1, 1);
  }

  setThrottle(value: number): void {
    this.throttleInput = clamp(value, 0, 1);
  }

  getThrottle(): number {
    return this.throttleInput;
  }

  setBrakeInput(value: number): void {
    this.brakeInput = clamp(value, 0, 1);
  }

  getBrakeInput(): number {
    return this.brakeInput;
  }

  setBraking(value: boolean): void {
    this.setBrakeInput(value ? 1 : 0);
  }

  setAccelerating(value: boolean): void {
    this.setThrottle(value ? 1 : 0);
  }

  isBraking(): boolean {
    return this.brakeInput > 0;
  }

  setHandbrake(value: boolean): void {
    this.handbrake = value;
  }

  isHandbraking(): boolean {
    return this.handbrake;
  }

  /** Reserved for a future "hold to boost/accelerate" control; currently the
   *  difficulty curve auto-accelerates, so this is unused but wired. */
  isAccelerating(): boolean {
    return this.throttleInput > 0;
  }

  /** Lets the HUD's on-screen buttons and a future settings screen drive
   *  input the same way a physical device would. */
  get touchControls() {
    return this.touch;
  }

  get tiltControls() {
    return this.tilt;
  }
}
