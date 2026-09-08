import type { LaneDirection, InputSource } from './InputTypes';
import { KeyboardSource } from './KeyboardSource';
import { TouchSource } from './TouchSource';
import { TiltSource } from './TiltSource';
import { PLAYER_TUNING } from '@/config/constants';

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

  // Auto-repeat while a direction is held (keyboard held down, HUD button
  // held) — see PLAYER_TUNING.laneChangeInputCooldown. The initial press
  // always fires immediately via requestLaneChange(); this only governs
  // repeats for as long as the source keeps the hold active.
  private heldDirection: LaneDirection | null = null;
  private heldTimer = 0;

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

  /** Called by "hold-capable" sources (keyboard, HUD lane buttons) on
   *  press/release so a sustained hold can keep stepping across lanes.
   *  Pass null when nothing is held (e.g. key released, or two opposing
   *  directions held at once — ambiguous, so no auto-repeat). */
  setLaneHeld(direction: LaneDirection | null): void {
    this.heldDirection = direction;
    this.heldTimer = 0;
  }

  /** Must be called once per gameplay frame (before consumeLaneRequests)
   *  to drive the hold-to-repeat timer. */
  update(dt: number): void {
    if (this.heldDirection === null) return;
    this.heldTimer += dt;
    if (this.heldTimer >= PLAYER_TUNING.laneChangeInputCooldown) {
      this.heldTimer -= PLAYER_TUNING.laneChangeInputCooldown;
      this.requestLaneChange(this.heldDirection);
    }
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
