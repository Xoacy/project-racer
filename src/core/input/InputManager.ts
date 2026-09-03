import type { LaneDirection, InputSource } from './InputTypes';
import { KeyboardSource } from './KeyboardSource';
import { TouchSource } from './TouchSource';
import { TiltSource } from './TiltSource';

/**
 * Unified input aggregator. Every control scheme (keyboard, swipe, tilt)
 * ultimately just calls `requestLaneChange` / `setBraking` on this — the
 * gameplay layer only ever talks to InputManager, never to a specific
 * scheme, so adding e.g. a gamepad source later touches only this file.
 */
export class InputManager {
  private pendingLaneRequests: LaneDirection[] = [];
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

  /** Called by input sources. */
  requestLaneChange(direction: LaneDirection): void {
    this.pendingLaneRequests.push(direction);
  }

  setBraking(value: boolean): void {
    this.braking = value;
  }

  setAccelerating(value: boolean): void {
    this.accelerating = value;
  }

  /** Called once per gameplay frame. Drains queued lane-change requests so
   *  each physical input maps to exactly one lane shift. */
  consumeLaneRequests(): LaneDirection[] {
    const requests = this.pendingLaneRequests;
    this.pendingLaneRequests = [];
    return requests;
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
