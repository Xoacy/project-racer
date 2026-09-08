import type { InputManager } from './InputManager';
import type { InputSource } from './InputTypes';

const SWIPE_THRESHOLD_PX = 40;
/** Extra pixels of swipe distance, beyond the initial threshold, that add
 *  one more lane to the jump — lets a long swipe cross several lanes in a
 *  single continuous gesture instead of one swipe per lane. */
const PX_PER_EXTRA_LANE = 70;
const MAX_LANES_PER_SWIPE = 3;

/**
 * Swipe-left/right on the game surface to change lanes. The brake button
 * itself lives in the DOM (HUDScreen) and calls `setBrakeButtonHeld`
 * directly on pointer down/up rather than going through swipe detection.
 */
export class TouchSource implements InputSource {
  private startX = 0;
  private startY = 0;
  private tracking = false;

  constructor(private manager: InputManager, private surface: HTMLElement) {}

  attach(): void {
    this.surface.addEventListener('touchstart', this.handleStart, { passive: true });
    this.surface.addEventListener('touchend', this.handleEnd, { passive: true });
  }

  detach(): void {
    this.surface.removeEventListener('touchstart', this.handleStart);
    this.surface.removeEventListener('touchend', this.handleEnd);
  }

  setBrakeButtonHeld(held: boolean): void {
    this.manager.setBraking(held);
  }

  private handleStart = (e: TouchEvent): void => {
    const touch = e.changedTouches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.tracking = true;
  };

  private handleEnd = (e: TouchEvent): void => {
    if (!this.tracking) return;
    this.tracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;

    const direction = dx > 0 ? 1 : -1;
    const extraDistance = Math.abs(dx) - SWIPE_THRESHOLD_PX;
    const lanes = Math.min(MAX_LANES_PER_SWIPE, 1 + Math.floor(extraDistance / PX_PER_EXTRA_LANE));
    for (let i = 0; i < lanes; i++) this.manager.requestLaneChange(direction);
  };
}
