import type { InputSource } from './InputTypes';
import { KeyboardSource } from './KeyboardSource';
import { TouchSource } from './TouchSource';
import { TiltSource } from './TiltSource';

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
  private braking = false;
  private accelerating = false;

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
    return this.lateralInput;
  }

  setBraking(value: boolean): void {
    this.braking = value;
  }

  setAccelerating(value: boolean): void {
    this.accelerating = value;
  }

  isBraking(): boolean {
    return this.braking;
  }

  /** Reserved for a future "hold to boost/accelerate" control; currently the
   *  difficulty curve auto-accelerates, so this is unused but wired. */
  isAccelerating(): boolean {
    return this.accelerating;
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
