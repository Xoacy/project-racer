import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const BRAKE_KEYS = new Set(['ArrowDown', 'KeyS', 'Space']);
const ACCEL_KEYS = new Set(['ArrowUp', 'KeyW']);

/**
 * Keyboard steering is inherently digital — a key is either down or up —
 * so it always requests full deflection (-1 or 1). The analog "feel" the
 * player experiences comes entirely from PlayerVehicle's own lateral
 * acceleration/deceleration curve reacting to that input, not from the
 * input value itself.
 */
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
    if (e.repeat) return;
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = true;
      this.syncLateralInput();
    } else if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = true;
      this.syncLateralInput();
    } else if (BRAKE_KEYS.has(e.code)) {
      this.manager.setBraking(true);
    } else if (ACCEL_KEYS.has(e.code)) {
      this.manager.setAccelerating(true);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (LEFT_KEYS.has(e.code)) {
      this.leftHeld = false;
      this.syncLateralInput();
    } else if (RIGHT_KEYS.has(e.code)) {
      this.rightHeld = false;
      this.syncLateralInput();
    } else if (BRAKE_KEYS.has(e.code)) {
      this.manager.setBraking(false);
    } else if (ACCEL_KEYS.has(e.code)) {
      this.manager.setAccelerating(false);
    }
  };

  /** Both keys held at once cancels out, like fighting a wheel in both
   *  directions — no arbitrary priority between them. */
  private syncLateralInput(): void {
    let value = 0;
    if (this.leftHeld) value -= 1;
    if (this.rightHeld) value += 1;
    this.manager.setLateralInput(value);
  }
}
