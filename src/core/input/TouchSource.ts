import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

/** Horizontal drag distance (px) from the touch's start point that maps to
 *  full lateral deflection. */
const MAX_DRAG_PX = 90;

/**
 * Press-and-drag steering: horizontal distance from where the touch
 * started maps continuously to lateral input, like a virtual joystick
 * anchored at the touch point — the further from the anchor, the stronger
 * the deflection, up to MAX_DRAG_PX. Lifting the finger returns to
 * neutral. The brake button lives in the DOM (HUDScreen) and calls
 * `setBrakeButtonHeld` directly rather than going through this gesture.
 */
export class TouchSource implements InputSource {
  private anchorX = 0;
  private tracking = false;

  constructor(private manager: InputManager, private surface: HTMLElement) {}

  attach(): void {
    this.surface.addEventListener('touchstart', this.handleStart, { passive: true });
    this.surface.addEventListener('touchmove', this.handleMove, { passive: true });
    this.surface.addEventListener('touchend', this.handleEnd, { passive: true });
    this.surface.addEventListener('touchcancel', this.handleEnd, { passive: true });
  }

  detach(): void {
    this.surface.removeEventListener('touchstart', this.handleStart);
    this.surface.removeEventListener('touchmove', this.handleMove);
    this.surface.removeEventListener('touchend', this.handleEnd);
    this.surface.removeEventListener('touchcancel', this.handleEnd);
  }

  setBrakeButtonHeld(held: boolean): void {
    this.manager.setBraking(held);
  }

  private handleStart = (e: TouchEvent): void => {
    this.anchorX = e.changedTouches[0].clientX;
    this.tracking = true;
  };

  private handleMove = (e: TouchEvent): void => {
    if (!this.tracking) return;
    const dx = e.changedTouches[0].clientX - this.anchorX;
    const value = Math.max(-1, Math.min(1, dx / MAX_DRAG_PX));
    this.manager.setLateralInput(value);
  };

  private handleEnd = (): void => {
    this.tracking = false;
    this.manager.setLateralInput(0);
  };
}
