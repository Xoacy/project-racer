import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const BRAKE_KEYS = new Set(['ArrowDown', 'KeyS', 'Space']);
const ACCEL_KEYS = new Set(['ArrowUp', 'KeyW']);

export class KeyboardSource implements InputSource {
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
    if (LEFT_KEYS.has(e.code)) this.manager.requestLaneChange(-1);
    else if (RIGHT_KEYS.has(e.code)) this.manager.requestLaneChange(1);
    else if (BRAKE_KEYS.has(e.code)) this.manager.setBraking(true);
    else if (ACCEL_KEYS.has(e.code)) this.manager.setAccelerating(true);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (BRAKE_KEYS.has(e.code)) this.manager.setBraking(false);
    else if (ACCEL_KEYS.has(e.code)) this.manager.setAccelerating(false);
  };
}
