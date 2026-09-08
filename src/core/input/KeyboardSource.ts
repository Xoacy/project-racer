import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const BRAKE_KEYS = new Set(['ArrowDown', 'KeyS', 'Space']);
const ACCEL_KEYS = new Set(['ArrowUp', 'KeyW']);

export class KeyboardSource implements InputSource {
  private leftHeld = false;
  private rightHeld = false;

  constructor(private manager: InputManager) {}

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Browser auto-repeat timing is inconsistent across OS/browser
    // settings, so it's ignored here — InputManager.update() drives our
    // own repeat cadence off PLAYER_TUNING.laneChangeInputCooldown instead.
    if (e.repeat) return;
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = true;
      this.manager.requestLaneChange(-1);
      this.syncHeldDirection();
    } else if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = true;
      this.manager.requestLaneChange(1);
      this.syncHeldDirection();
    } else if (BRAKE_KEYS.has(e.code)) {
      this.manager.setBraking(true);
    } else if (ACCEL_KEYS.has(e.code)) {
      this.manager.setAccelerating(true);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = false;
      this.syncHeldDirection();
    } else if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = false;
      this.syncHeldDirection();
    } else if (BRAKE_KEYS.has(e.code)) {
      this.manager.setBraking(false);
    } else if (ACCEL_KEYS.has(e.code)) {
      this.manager.setAccelerating(false);
    }
  };

  /** Both keys held at once is ambiguous — treat it as "hold nothing"
   *  rather than guessing a priority. */
  private syncHeldDirection(): void {
    if (this.leftHeld && !this.rightHeld) this.manager.setLaneHeld(-1);
    else if (this.rightHeld && !this.leftHeld) this.manager.setLaneHeld(1);
    else this.manager.setLaneHeld(null);
  }
}
